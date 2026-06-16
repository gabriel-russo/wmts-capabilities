import XMLParser, { pushParseAndPop } from './xml_parser';
import NODE_TYPES from './node_types';
import { PARSERS } from './parsers';
import type { WMTSCapabilitiesJSON } from './types';

export type { WMTSCapabilitiesJSON } from './types';

export default class WMTS {
  version: string | undefined;
  private docParser: XMLParser;
  private xmlData: string | undefined;

  constructor(
    xmlString?: string,
    DOMParser?: { new (): { parseFromString(xml: string, mime: string): Document } },
  ) {
    if (DOMParser == null) {
      throw new TypeError('DOMParser constructor is required. Use @xmldom/xmldom in Node.js.');
    }
    this.docParser = new XMLParser(DOMParser);
    this.xmlData = xmlString;
  }

  setXml(xml: string): this {
    this.xmlData = xml;
    return this;
  }

  toJSON(xml?: string): WMTSCapabilitiesJSON | null {
    const source = xml ?? this.xmlData;
    if (source == null) throw new Error('No XML provided');
    return this.parse(source);
  }

  parse(xml: string): WMTSCapabilitiesJSON | null {
    return this.readFromDocument(this.docParser.toDocument(xml));
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
    ) as WMTSCapabilitiesJSON;
  }
}
