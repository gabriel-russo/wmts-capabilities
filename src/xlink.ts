const XLINK_NS = 'http://www.w3.org/1999/xlink';

export function readHref(node: Element): string | undefined {
  const value = node.getAttributeNS(XLINK_NS, 'href');
  return value != null ? value : undefined;
}
