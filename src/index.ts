import XMLParser, { pushParseAndPop } from './xml_parser';
import NODE_TYPES from './node_types';
import { PARSERS } from './parsers';
import type { WMTSCapabilitiesJSON } from './types';

export type { WMTSCapabilitiesJSON } from './types';

function resolveDOMParser(
  domParser?: Pick<DOMParser, 'parseFromString'>,
): Pick<DOMParser, 'parseFromString'> {
  if (domParser != null) return domParser;
  const global = globalThis as Record<string, unknown>;
  if (typeof global.DOMParser === 'function') {
    return new (global.DOMParser as typeof DOMParser)();
  }
  throw new TypeError(
    'DOMParser not found. In Node.js, pass an instance from @xmldom/xmldom:\n' +
      '  import { DOMParser } from "@xmldom/xmldom";\n' +
      '  new WMTS(xml, new DOMParser()).toJSON();',
  );
}

export default class WMTS {
  version: string | undefined;
  private readonly _parser: XMLParser;
  private _xml: string | undefined;

  constructor(xml?: string, domParser?: Pick<DOMParser, 'parseFromString'>) {
    this._parser = new XMLParser(resolveDOMParser(domParser));
    this._xml = xml;
  }

  setXml(xml: string): this {
    this._xml = xml;
    return this;
  }

  toJSON(xml?: string): WMTSCapabilitiesJSON | null {
    const source = xml ?? this._xml;
    if (source == null) throw new Error('No XML provided');
    return this.parse(source);
  }

  parse(xml: string): WMTSCapabilitiesJSON | null {
    return this.readFromDocument(this._parser.toDocument(xml));
  }

  readFromDocument(doc: Document): WMTSCapabilitiesJSON | null {
    for (let child = doc.firstChild; child != null; child = child.nextSibling) {
      if (child.nodeType === NODE_TYPES.ELEMENT) {
        return this.readFromNode(child as Element);
      }
    }
    return null;
  }

  readFromNode(node: Element): WMTSCapabilitiesJSON {
    this.version = node.getAttribute('version') ?? undefined;
    return pushParseAndPop(
      { version: this.version ?? '' },
      PARSERS,
      node,
      [],
    ) as unknown as WMTSCapabilitiesJSON;
  }
}
