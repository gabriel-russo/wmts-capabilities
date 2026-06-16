import NODE_TYPES from './node_types';

export type StackObject = Record<string, unknown>;
export type StackItem = StackObject | unknown[];
export type ParserStack = StackItem[];
export type ParserFn = (node: Element, stack: ParserStack) => void;
export type ReaderFn = (node: Element, stack: ParserStack) => unknown;
export type ParsersNS = Record<string, Record<string, ParserFn>>;

export default class XMLParser {
  private _domParser: Pick<DOMParser, 'parseFromString'>;

  constructor(domParser: Pick<DOMParser, 'parseFromString'>) {
    this._domParser = domParser;
  }

  toDocument(xml: string): Document {
    return this._domParser.parseFromString(xml, 'application/xml');
  }

  getAllTextContent(node: Node, normalizeWhitespace = false): string {
    return getAllTextContent(node, normalizeWhitespace);
  }
}

export function getAllTextContent(node: Node, normalizeWhitespace: boolean): string {
  const acc: string[] = [];
  collectText(node, normalizeWhitespace, acc);
  return acc.join('');
}

function collectText(node: Node, normalize: boolean, acc: string[]): void {
  if (node.nodeType === NODE_TYPES.CDATA_SECTION || node.nodeType === NODE_TYPES.TEXT) {
    const text = (node as CharacterData).data ?? '';
    acc.push(normalize ? text.replace(/\r\n|\r|\n/g, '') : text);
  } else {
    for (let child = node.firstChild; child != null; child = child.nextSibling) {
      collectText(child, normalize, acc);
    }
  }
}

export function parseNode(parsersNS: ParsersNS, node: Element, stack: ParserStack, ctx?: object): void {
  for (let child = firstElementChild(node); child != null; child = nextElementSibling(child)) {
    const uri = child.namespaceURI ?? '';
    const ns = parsersNS[uri];
    if (!ns) continue;
    const parser = ns[child.localName];
    if (parser) parser.call(ctx, child, stack);
  }
}

export function firstElementChild(node: Element): Element | null {
  let child = node.firstElementChild ?? node.firstChild;
  while (child != null && child.nodeType !== NODE_TYPES.ELEMENT) child = child.nextSibling;
  return child as Element | null;
}

function nextElementSibling(node: Element): Element | null {
  let sib = node.nextElementSibling ?? node.nextSibling;
  while (sib != null && sib.nodeType !== NODE_TYPES.ELEMENT) sib = sib.nextSibling;
  return sib as Element | null;
}

export function makeParsersNS(
  namespaceURIs: string[],
  parsers: Record<string, ParserFn>,
  existing?: ParsersNS,
): ParsersNS {
  const result = existing ?? ({} as ParsersNS);
  for (const uri of namespaceURIs) result[uri] = parsers;
  return result;
}

export function pushParseAndPop(
  seed: StackItem,
  parsersNS: ParsersNS,
  node: Element,
  stack: ParserStack,
  ctx?: object,
): StackItem {
  stack.push(seed);
  parseNode(parsersNS, node, stack, ctx);
  return stack.pop() as StackItem;
}

export function makeArrayPusher(valueReader: ReaderFn): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value == null) return;
    (stack[stack.length - 1] as unknown[]).push(value);
  };
}

export function makeObjectPropertySetter(valueReader: ReaderFn, property?: string): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value == null) return;
    const obj = stack[stack.length - 1] as StackObject;
    obj[property ?? node.localName] = value;
  };
}

export function makeObjectPropertyPusher(valueReader: ReaderFn, property?: string): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value == null) return;
    const obj = stack[stack.length - 1] as StackObject;
    const key = property ?? node.localName;
    if (!(key in obj)) obj[key] = [];
    (obj[key] as unknown[]).push(value);
  };
}
