import isDef from './utils/isdef';
import { trim } from './utils/string';
import XMLParser, { getAllTextContent } from './xml_parser';

export const NAMESPACE_URI = 'http://www.w3.org/2001/XMLSchema';

export function readBoolean(node) {
  var s = getAllTextContent(node, false);
  return readBooleanString(s);
}

export function readBooleanString(string) {
  var m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
  if (m) {
    return isDef(m[1]) || false;
  } else {
    return undefined;
  }
}

export function readDateTime(node) {
  var s = getAllTextContent(node, false);
  var re = /^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?))\s*$/;
  var m = re.exec(s);
  if (m) {
    var year = parseInt(m[1], 10);
    var month = parseInt(m[2], 10) - 1;
    var day = parseInt(m[3], 10);
    var hour = parseInt(m[4], 10);
    var minute = parseInt(m[5], 10);
    var second = parseInt(m[6], 10);
    var dateTime = Date.UTC(year, month, day, hour, minute, second) / 1000;
    if (m[7] != 'Z') {
      var sign = m[8] == '-' ? -1 : 1;
      dateTime += sign * 60 * parseInt(m[9], 10);
      if (isDef(m[10])) {
        dateTime += sign * 60 * 60 * parseInt(m[10], 10);
      }
    }
    return dateTime;
  } else {
    return undefined;
  }
}

export function readDecimal(node) {
  return readDecimalString(getAllTextContent(node, false));
}

export function readDecimalString(string) {
  var m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
  if (m) {
    return parseFloat(m[1]);
  } else {
    return undefined;
  }
}

export function readNonNegativeInteger(node) {
  return readNonNegativeIntegerString(getAllTextContent(node, false));
}

export function readNonNegativeIntegerString(string) {
  var m = /^\s*(\d+)\s*$/.exec(string);
  if (m) {
    return parseInt(m[1], 10);
  } else {
    return undefined;
  }
}

export function readString(node) {
  return trim(getAllTextContent(node, false));
}
