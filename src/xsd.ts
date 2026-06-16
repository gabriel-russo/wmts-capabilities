import { getAllTextContent } from './xml_parser';

function trim(str: string): string {
  return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

export function readString(node: Element): string {
  return trim(getAllTextContent(node, false));
}

export function readBoolean(node: Element): boolean | undefined {
  return parseBoolean(getAllTextContent(node, false));
}

export function parseBoolean(text: string): boolean | undefined {
  const m = /^\s*(true|1)|(false|0)\s*$/.exec(text);
  if (m === null) return undefined;
  return m[1] !== undefined;
}

export function readDecimal(node: Element): number | undefined {
  return parseDecimal(getAllTextContent(node, false));
}

export function parseDecimal(text: string): number | undefined {
  const m = /^\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*$/i.exec(text);
  if (m === null) return undefined;
  return parseFloat(m[1]!);
}

export function readNonNegativeInteger(node: Element): number | undefined {
  return parseNonNegativeInteger(getAllTextContent(node, false));
}

export function parseNonNegativeInteger(text: string): number | undefined {
  const m = /^\s*(\d+)\s*$/.exec(text);
  if (m === null) return undefined;
  return parseInt(m[1]!, 10);
}
