import {
  makeObjectPropertySetter,
  makeObjectPropertyPusher,
  makeParsersNS,
  pushParseAndPop,
  makeArrayPusher,
} from './xml_parser';
import type { ParserFn } from './xml_parser';
import { readString, parseBoolean, readNonNegativeInteger, readDecimal } from './xsd';
import { readHref } from './xlink';

// ── Namespaces ────────────────────────────────────────────────────

const WMTS = 'http://www.opengis.net/wmts/1.0';
const OWS = 'http://www.opengis.net/ows/1.1';

// ── Reader helpers ────────────────────────────────────────────────

function readCoordinates(node: Element): number[] | undefined {
  const s = readString(node);
  return s ? s.split(/\s+/).map(Number) : undefined;
}

// BoundingBox (WGS84 and regular share the same structure)
function readWGS84BoundingBox(node: Element, stack: any[]): any {
  const crs = node.getAttribute('crs');
  const obj = pushParseAndPop({}, OWS_BBOX_PARSERS, node, stack);
  if (crs) obj.crs = crs;
  return obj;
}

const readBoundingBox = readWGS84BoundingBox;

// ── OperationsMetadata ────────────────────────────────────────────

function readOperation(node: Element, stack: any[]): any {
  return pushParseAndPop({ name: node.getAttribute('name') ?? '' }, OPERATION_PARSERS, node, stack);
}

function readGetPost(node: Element, stack: any[]): any {
  const href = readHref(node);
  const obj = pushParseAndPop({}, GETPOST_PARSERS, node, stack);
  if (href != null) obj.href = href;
  if (Object.keys(obj).length === 1 && 'href' in obj) return href as string;
  return obj;
}

function readParameter(node: Element, stack: any[]): any {
  return pushParseAndPop({ name: node.getAttribute('name') ?? '' }, PARAMETER_PARSERS, node, stack);
}

function readAllowedValues(node: Element, stack: any[]): any {
  return pushParseAndPop([], ALLOWED_VALUES_PARSERS, node, stack);
}

// ── Contents ──────────────────────────────────────────────────────

function readStyle(node: Element, stack: any[]): any {
  const isDefault = parseBoolean(node.getAttribute('isDefault') ?? '');
  const obj = pushParseAndPop({}, STYLE_PARSERS, node, stack);
  if (isDefault != null) obj.isDefault = isDefault;
  return obj;
}

function readLegendURL(node: Element): any {
  const href = readHref(node);
  const obj: any = {};
  const format = node.getAttribute('format');
  const width = node.getAttribute('width');
  const height = node.getAttribute('height');
  if (format) obj.format = format;
  if (href) obj.href = href;
  if (width != null) obj.width = parseFloat(width);
  if (height != null) obj.height = parseFloat(height);
  return obj;
}

function readResourceURL(node: Element): any {
  const obj: any = {};
  const format = node.getAttribute('format');
  const resourceType = node.getAttribute('resourceType');
  const template = node.getAttribute('template');
  if (format) obj.format = format;
  if (resourceType) obj.resourceType = resourceType;
  if (template) obj.template = template;
  return obj;
}

function readMetadata(node: Element): any {
  const href = readHref(node);
  const about = node.getAttribute('about');
  const type = node.getAttributeNS('http://www.w3.org/1999/xlink', 'type');
  const obj: any = {};
  if (href) obj.href = href;
  if (about) obj.about = about;
  if (type) obj.type = type;
  return obj;
}

function readKeywords(node: Element, stack: any[]): any {
  return pushParseAndPop([], KEYWORDS_PARSERS, node, stack);
}

// ═══════════════════════════════════════════════════════════════════
// Parser maps — defined bottom-up so all refs are hoisted-safe
// ═══════════════════════════════════════════════════════════════════

// Shared bits

function stringProps(...names: string[]): Record<string, ParserFn> {
  return Object.fromEntries(names.map((n) => [n, makeObjectPropertySetter(readString)]));
}

const keywords = makeObjectPropertySetter(readKeywords);

// ── Leaf-level parsers ────────────────────────────────────────────

const KEYWORDS_PARSERS = makeParsersNS([OWS], {
  Keyword: makeArrayPusher(readString),
});

const OWS_BBOX_PARSERS = makeParsersNS([OWS], {
  LowerCorner: makeObjectPropertySetter(readCoordinates),
  UpperCorner: makeObjectPropertySetter(readCoordinates),
});

const ALLOWED_VALUES_PARSERS = makeParsersNS([OWS], {
  Value: makeArrayPusher(readString),
});

const PARAMETER_PARSERS = makeParsersNS([OWS], {
  AllowedValues: makeObjectPropertySetter(readAllowedValues as ParserFn),
});

const GETPOST_PARSERS = makeParsersNS([OWS], {
  Constraint: makeObjectPropertyPusher(readParameter),
});

const HTTP_PARSERS = makeParsersNS([OWS], {
  Get: makeObjectPropertyPusher(readGetPost),
  Post: makeObjectPropertyPusher(readGetPost),
});

const DCP_PARSERS = makeParsersNS([OWS], {
  HTTP: makeObjectPropertySetter((node, stack) => pushParseAndPop({}, HTTP_PARSERS, node, stack)),
});

const OPERATION_PARSERS = makeParsersNS([OWS], {
  DCP: makeObjectPropertyPusher((node, stack) => pushParseAndPop({}, DCP_PARSERS, node, stack)),
  Parameter: makeObjectPropertyPusher(readParameter),
  Constraint: makeObjectPropertyPusher(readParameter),
});

const OPERATIONS_METADATA_PARSERS = makeParsersNS([OWS], {
  Operation: makeObjectPropertyPusher(readOperation),
  Parameter: makeObjectPropertyPusher(readParameter),
  Constraint: makeObjectPropertyPusher(readParameter),
});

// ── ServiceIdentification ─────────────────────────────────────────

const SERVICE_IDENTIFICATION_PARSERS = makeParsersNS([OWS], {
  ...stringProps(
    'Title',
    'Abstract',
    'ServiceType',
    'ServiceTypeVersion',
    'Fees',
    'AccessConstraints',
  ),
  Keywords: keywords,
});

// ── ServiceProvider ───────────────────────────────────────────────

const ADDRESS_PARSERS = makeParsersNS(
  [OWS],
  stringProps(
    'DeliveryPoint',
    'City',
    'AdministrativeArea',
    'PostalCode',
    'Country',
    'ElectronicMailAddress',
  ),
);

const PHONE_PARSERS = makeParsersNS([OWS], stringProps('Voice', 'Facsimile'));

const CONTACT_INFO_PARSERS = makeParsersNS([OWS], {
  Phone: makeObjectPropertySetter((n, s) => pushParseAndPop({}, PHONE_PARSERS, n, s)),
  Address: makeObjectPropertySetter((n, s) => pushParseAndPop({}, ADDRESS_PARSERS, n, s)),
});

const SERVICE_CONTACT_PARSERS = makeParsersNS([OWS], {
  ...stringProps('IndividualName', 'PositionName'),
  ContactInfo: makeObjectPropertySetter((n, s) => pushParseAndPop({}, CONTACT_INFO_PARSERS, n, s)),
});

const SERVICE_PROVIDER_PARSERS = makeParsersNS([OWS], {
  ProviderName: makeObjectPropertySetter(readString),
  ProviderSite: makeObjectPropertySetter(readHref),
  ServiceContact: makeObjectPropertySetter((n, s) =>
    pushParseAndPop({}, SERVICE_CONTACT_PARSERS, n, s),
  ),
});

// ── Layers ────────────────────────────────────────────────────────

const STYLE_PARSERS = makeParsersNS([WMTS, OWS], {
  ...stringProps('Title', 'Identifier', 'Abstract'),
  Keywords: keywords,
  LegendURL: makeObjectPropertyPusher(readLegendURL),
});

const TILE_MATRIX_LIMITS_PARSERS = makeParsersNS([WMTS], {
  ...stringProps('TileMatrix'),
  MinTileRow: makeObjectPropertySetter(readNonNegativeInteger),
  MaxTileRow: makeObjectPropertySetter(readNonNegativeInteger),
  MinTileCol: makeObjectPropertySetter(readNonNegativeInteger),
  MaxTileCol: makeObjectPropertySetter(readNonNegativeInteger),
});

const TILE_MATRIX_SET_LIMITS_PARSERS = makeParsersNS([WMTS], {
  TileMatrixLimits: makeObjectPropertyPusher((n, s) =>
    pushParseAndPop({}, TILE_MATRIX_LIMITS_PARSERS, n, s),
  ),
});

const TILE_MATRIX_SET_LINK_PARSERS = makeParsersNS([WMTS], {
  TileMatrixSet: makeObjectPropertySetter(readString),
  TileMatrixSetLimits: makeObjectPropertySetter((n, s) =>
    pushParseAndPop({}, TILE_MATRIX_SET_LIMITS_PARSERS, n, s),
  ),
});

const LAYER_PARSERS = makeParsersNS([WMTS, OWS], {
  ...stringProps('Title', 'Abstract', 'Identifier'),
  Keywords: keywords,
  WGS84BoundingBox: makeObjectPropertySetter(readWGS84BoundingBox),
  BoundingBox: makeObjectPropertyPusher(readBoundingBox),
  Metadata: makeObjectPropertyPusher(readMetadata),
  Style: makeObjectPropertyPusher(readStyle),
  Format: makeObjectPropertyPusher(readString),
  InfoFormat: makeObjectPropertyPusher(readString),
  TileMatrixSetLink: makeObjectPropertyPusher((n, s) =>
    pushParseAndPop({}, TILE_MATRIX_SET_LINK_PARSERS, n, s),
  ),
  ResourceURL: makeObjectPropertyPusher(readResourceURL),
});

// ── TileMatrixSet ─────────────────────────────────────────────────

const TILE_MATRIX_PARSERS = makeParsersNS([WMTS, OWS], {
  ...stringProps('Title', 'Abstract', 'Identifier'),
  Keywords: keywords,
  ScaleDenominator: makeObjectPropertySetter(readDecimal),
  TopLeftCorner: makeObjectPropertySetter(readCoordinates),
  TileWidth: makeObjectPropertySetter(readNonNegativeInteger),
  TileHeight: makeObjectPropertySetter(readNonNegativeInteger),
  MatrixWidth: makeObjectPropertySetter(readNonNegativeInteger),
  MatrixHeight: makeObjectPropertySetter(readNonNegativeInteger),
});

const TILE_MATRIX_SET_ITEM_PARSERS = makeParsersNS([WMTS, OWS], {
  ...stringProps('Title', 'Abstract', 'Identifier', 'SupportedCRS', 'WellKnownScaleSet'),
  Keywords: keywords,
  Metadata: makeObjectPropertyPusher(readMetadata),
  BoundingBox: makeObjectPropertySetter(readBoundingBox),
  TileMatrix: makeObjectPropertyPusher((n, s) => pushParseAndPop({}, TILE_MATRIX_PARSERS, n, s)),
});

// ── Contents ──────────────────────────────────────────────────────

const CONTENTS_PARSERS = makeParsersNS([WMTS], {
  Layer: makeObjectPropertyPusher((n, s) => pushParseAndPop({}, LAYER_PARSERS, n, s)),
  TileMatrixSet: makeObjectPropertyPusher((n, s) =>
    pushParseAndPop({}, TILE_MATRIX_SET_ITEM_PARSERS, n, s),
  ),
});

// ── Themes (self-referential) ─────────────────────────────────────

const baseThemeParsers: Record<string, ParserFn> = {
  ...stringProps('Title', 'Abstract', 'Identifier'),
  Keywords: keywords,
  LayerRef: makeObjectPropertyPusher(readString),
};

const THEME_PARSERS = makeParsersNS([WMTS, OWS], baseThemeParsers);

function readTheme(node: Element, stack: any[]): any {
  return pushParseAndPop({}, THEME_PARSERS, node, stack);
}

THEME_PARSERS[WMTS].Theme = makeObjectPropertyPusher(readTheme);
THEME_PARSERS[OWS].Theme = makeObjectPropertyPusher(readTheme);

const THEMES_PARSERS = makeParsersNS([WMTS], {
  Theme: makeObjectPropertyPusher(readTheme),
});

// ═══════════════════════════════════════════════════════════════════
// Root parsers
// ═══════════════════════════════════════════════════════════════════

export const PARSERS = makeParsersNS([WMTS, OWS], {
  ServiceIdentification: makeObjectPropertySetter((n, s) =>
    pushParseAndPop({}, SERVICE_IDENTIFICATION_PARSERS, n, s),
  ),
  ServiceProvider: makeObjectPropertySetter((n, s) =>
    pushParseAndPop({}, SERVICE_PROVIDER_PARSERS, n, s),
  ),
  OperationsMetadata: makeObjectPropertySetter((n, s) =>
    pushParseAndPop({}, OPERATIONS_METADATA_PARSERS, n, s),
  ),
  Contents: makeObjectPropertySetter((n, s) => pushParseAndPop({}, CONTENTS_PARSERS, n, s)),
  Themes: makeObjectPropertySetter((n, s) => pushParseAndPop({}, THEMES_PARSERS, n, s)),
  ServiceMetadataURL: makeObjectPropertySetter(readHref),
});
