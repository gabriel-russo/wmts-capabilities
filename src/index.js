import XMLParser, { pushParseAndPop } from './xml_parser';
import nodeTypes from './node_types';
import { PARSERS } from './parsers';

export default class WMTS {
  constructor(xmlString, DOMParser) {
    if (!DOMParser && typeof window !== 'undefined') {
      DOMParser = window.DOMParser;
    }
    this.version = undefined;
    this._parser = new XMLParser(DOMParser);
    this._data = xmlString;
  }

  data(xmlString) {
    this._data = xmlString;
    return this;
  }

  toJSON(xmlString) {
    xmlString = xmlString || this._data;
    return this.parse(xmlString);
  }

  parse(xmlString) {
    return this.readFromDocument(this._parser.toDocument(xmlString));
  }

  readFromDocument(doc) {
    for (var node = doc.firstChild; node; node = node.nextSibling) {
      if (node.nodeType == nodeTypes.ELEMENT) {
        return this.readFromNode(node);
      }
    }
    return null;
  }

  readFromNode(node) {
    this.version = node.getAttribute('version');
    var wmtsCapabilityObject = pushParseAndPop({
      'version': this.version
    }, PARSERS, node, []);
    return wmtsCapabilityObject || null;
  }
}
