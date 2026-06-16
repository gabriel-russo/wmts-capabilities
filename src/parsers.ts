import {
  makeObjectPropertySetter,
  makeObjectPropertyPusher,
  makeParsersNS,
  pushParseAndPop,
  makeArrayPusher,
} from './xml_parser';
import type { ParserFn, StackObject, ParserStack, ReaderFn } from './xml_parser';
import { readString, parseBoolean, readNonNegativeInteger, readDecimal } from './xsd';
import { readHref } from './xlink';

const WMTS = 'http://www.opengis.net/wmts/1.0';
const OWS = 'http://www.opengis.net/ows/1.1';

// ── Reader helpers ────────────────────────────────────────────────

function readCoordinates(node: Element): number[] | undefined {
  const s = readString(node);
  return s ? s.split(/\s+/).map(Number) : undefined;
}

function readWGS84BoundingBox(node: Element, stack: ParserStack): StackObject {
  const crs = node.getAttribute('crs');
  const obj = pushParseAndPop({}, OWS_BBOX_PARSERS, node, stack) as StackObject;
  if (crs) obj.crs = crs;
  return obj;
}

const readBoundingBox = readWGS84BoundingBox;

// ── OperationsMetadata ────────────────────────────────────────────

function readOperation(node: Element, stack: ParserStack): StackObject {
  return pushParseAndPop(
    { name: node.getAttribute('name') ?? '' },
    OPERATION_PARSERS,
    node,
    stack,
  ) as StackObject;
}

function readGetPost(node: Element, stack: ParserStack): string | StackObject {
  const href = readHref(node);
  const obj = pushParseAndPop({}, GETPOST_PARSERS, node, stack) as StackObject;
  if (href != null) obj.href = href;
  if (Object.keys(obj).length === 1 && 'href' in obj) return href as string;
  return obj;
}

function readParameter(node: Element, stack: ParserStack): StackObject {
  return pushParseAndPop(
    { name: node.getAttribute('name') ?? '' },
    PARAMETER_PARSERS,
    node,
    stack,
  ) as StackObject;
}

function readAllowedValues(node: Element, stack: ParserStack): string[] {
  return pushParseAndPop([], ALLOWED_VALUES_PARSERS, node, stack) as unknown as string[];
}

// ── Contents ──────────────────────────────────────────────────────

function readStyle(node: Element, stack: ParserStack): StackObject {
  const isDefault = parseBoolean(node.getAttribute('isDefault') ?? '');
  const obj = pushParseAndPop({}, STYLE_PARSERS, node, stack) as StackObject;
  if (isDefault != null) obj.isDefault = isDefault;
  return obj;
}

function readLegendURL(node: Element): StackObject {
  const href = readHref(node);
  const obj: StackObject = {};
  const format = node.getAttribute('format');
  const widthAttr = node.getAttribute('width');
  const heightAttr = node.getAttribute('height');
  if (format) obj.format = format;
  if (href) obj.href = href;
  if (widthAttr != null) obj.width = parseFloat(widthAttr);
  if (heightAttr != null) obj.height = parseFloat(heightAttr);
  return obj;
}

function readResourceURL(node: Element): StackObject {
  const obj: StackObject = {};
  const format = node.getAttribute('format');
  const resourceType = node.getAttribute('resourceType');
  const template = node.getAttribute('template');
  if (format) obj.format = format;
  if (resourceType) obj.resourceType = resourceType;
  if (template) obj.template = template;
  return obj;
}

function readMetadata(node: Element): StackObject {
  const href = readHref(node);
  const about = node.getAttribute('about');
  const type = node.getAttributeNS('http://www.w3.org/1999/xlink', 'type');
  const obj: StackObject = {};
  if (href) obj.href = href;
  if (about) obj.about = about;
  if (type) obj.type = type;
  return obj;
}

function readKeywords(node: Element, stack: ParserStack): string[] {
  return pushParseAndPop([], KEYWORDS_PARSERS, node, stack) as unknown as string[];
}

function readTheme(node: Element, stack: ParserStack): StackObject {
  return pushParseAndPop({}, THEME_PARSERS, node, stack) as StackObject;
}

// ── Shared helpers ────────────────────────────────────────────────

function stringProps(...names: string[]): Record<string, ParserFn> {
  return Object.fromEntries(names.map((n) => [n, makeObjectPropertySetter(readString)]));
}

const keywords = makeObjectPropertySetter(readKeywords);

const subtree = (parsers: Record<string, Record<string, ParserFn>>): ReaderFn => {
  return (node: Element, stack: ParserStack) => pushParseAndPop({}, parsers, node, stack);
};

// ═══════════════════════════════════════════════════════════════════
// Parser maps — leaf to root
// ═══════════════════════════════════════════════════════════════════

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
  AllowedValues: makeObjectPropertySetter(readAllowedValues),
});

const GETPOST_PARSERS = makeParsersNS([OWS], {
  Constraint: makeObjectPropertyPusher(readParameter),
});

const HTTP_PARSERS = makeParsersNS([OWS], {
  Get: makeObjectPropertyPusher(readGetPost),
  Post: makeObjectPropertyPusher(readGetPost),
});

const DCP_PARSERS = makeParsersNS([OWS], {
  HTTP: makeObjectPropertySetter(subtree(HTTP_PARSERS)),
});

const OPERATION_PARSERS = makeParsersNS([OWS], {
  DCP: makeObjectPropertyPusher(subtree(DCP_PARSERS)),
  Parameter: makeObjectPropertyPusher(readParameter),
  Constraint: makeObjectPropertyPusher(readParameter),
});

const OPERATIONS_METADATA_PARSERS = makeParsersNS([OWS], {
  Operation: makeObjectPropertyPusher(readOperation),
  Parameter: makeObjectPropertyPusher(readParameter),
  Constraint: makeObjectPropertyPusher(readParameter),
});

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
  Phone: makeObjectPropertySetter(subtree(PHONE_PARSERS)),
  Address: makeObjectPropertySetter(subtree(ADDRESS_PARSERS)),
});

const SERVICE_CONTACT_PARSERS = makeParsersNS([OWS], {
  ...stringProps('IndividualName', 'PositionName'),
  ContactInfo: makeObjectPropertySetter(subtree(CONTACT_INFO_PARSERS)),
});

const SERVICE_PROVIDER_PARSERS = makeParsersNS([OWS], {
  ProviderName: makeObjectPropertySetter(readString),
  ProviderSite: makeObjectPropertySetter(readHref),
  ServiceContact: makeObjectPropertySetter(subtree(SERVICE_CONTACT_PARSERS)),
});

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
  TileMatrixLimits: makeObjectPropertyPusher(subtree(TILE_MATRIX_LIMITS_PARSERS)),
});

const TILE_MATRIX_SET_LINK_PARSERS = makeParsersNS([WMTS], {
  TileMatrixSet: makeObjectPropertySetter(readString),
  TileMatrixSetLimits: makeObjectPropertySetter(subtree(TILE_MATRIX_SET_LIMITS_PARSERS)),
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
  TileMatrixSetLink: makeObjectPropertyPusher(subtree(TILE_MATRIX_SET_LINK_PARSERS)),
  ResourceURL: makeObjectPropertyPusher(readResourceURL),
});

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
  TileMatrix: makeObjectPropertyPusher(subtree(TILE_MATRIX_PARSERS)),
});

const CONTENTS_PARSERS = makeParsersNS([WMTS], {
  Layer: makeObjectPropertyPusher(subtree(LAYER_PARSERS)),
  TileMatrixSet: makeObjectPropertyPusher(subtree(TILE_MATRIX_SET_ITEM_PARSERS)),
});

const baseThemeParsers: Record<string, ParserFn> = {
  ...stringProps('Title', 'Abstract', 'Identifier'),
  Keywords: keywords,
  LayerRef: makeObjectPropertyPusher(readString),
};

const THEME_PARSERS = makeParsersNS([WMTS, OWS], baseThemeParsers);
THEME_PARSERS[WMTS].Theme = makeObjectPropertyPusher(readTheme);
THEME_PARSERS[OWS].Theme = makeObjectPropertyPusher(readTheme);

const THEMES_PARSERS = makeParsersNS([WMTS], {
  Theme: makeObjectPropertyPusher(readTheme),
});

// ═══════════════════════════════════════════════════════════════════
// Root
// ═══════════════════════════════════════════════════════════════════

export const PARSERS = makeParsersNS([WMTS, OWS], {
  ServiceIdentification: makeObjectPropertySetter(subtree(SERVICE_IDENTIFICATION_PARSERS)),
  ServiceProvider: makeObjectPropertySetter(subtree(SERVICE_PROVIDER_PARSERS)),
  OperationsMetadata: makeObjectPropertySetter(subtree(OPERATIONS_METADATA_PARSERS)),
  Contents: makeObjectPropertySetter(subtree(CONTENTS_PARSERS)),
  Themes: makeObjectPropertySetter(subtree(THEMES_PARSERS)),
  ServiceMetadataURL: makeObjectPropertySetter(readHref),
});
