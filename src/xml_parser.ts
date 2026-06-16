import NODE_TYPES from './node_types';

export type ParserFn = (node: Element, objectStack: any[]) => void;

export type ParsersNS = Record<string, Record<string, ParserFn>>;

export default class XMLParser {
  private readonly doParser: { new (): { parseFromString(xml: string, mime: string): Document } };

  constructor(DOMParser: { new (): { parseFromString(xml: string, mime: string): Document } }) {
    this.doParser = DOMParser;
  }

  toDocument(xml: string): Document {
    return new this.doParser().parseFromString(xml, 'application/xml');
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

export function parseNode(parsersNS: ParsersNS, node: Element, stack: any[], bind?: any): void {
  for (let child = firstElementChild(node); child != null; child = nextElementSibling(child)) {
    const uri = child.namespaceURI ?? '';
    const map = parsersNS[uri];
    if (!map) continue;
    const parser = map[child.localName];
    if (parser) parser.call(bind, child, stack);
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
  seed: any,
  parsersNS: ParsersNS,
  node: Element,
  stack: any[],
  bind?: any,
): any {
  stack.push(seed);
  parseNode(parsersNS, node, stack, bind);
  return stack.pop();
}

export function makeArrayPusher(valueReader: (node: Element, stack: any[]) => any): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value != null) stack[stack.length - 1].push(value);
  };
}

export function makeObjectPropertySetter(
  valueReader: (node: Element, stack: any[]) => any,
  property?: string,
): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value != null) {
      stack[stack.length - 1][property ?? node.localName] = value;
    }
  };
}

export function makeObjectPropertyPusher(
  valueReader: (node: Element, stack: any[]) => any,
  property?: string,
): ParserFn {
  return (node, stack) => {
    const value = valueReader(node, stack);
    if (value == null) return;
    const obj = stack[stack.length - 1];
    const key = property ?? node.localName;
    if (!(key in obj)) obj[key] = [];
    obj[key].push(value);
  };
}
