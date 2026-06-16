import {
  makeObjectPropertySetter,
  makeObjectPropertyPusher,
  makeParsersNS,
  pushParseAndPop,
  makeArrayPusher
} from './xml_parser';
import {
  readString,
  readDecimalString,
  readBooleanString,
  readNonNegativeIntegerString,
  readNonNegativeInteger,
  readDecimal
} from './xsd';
import { readHref } from './xlink';
import setIfUndefined from './utils/setifundefined';
import isDef from './utils/isdef';

var WMTS_NS = 'http://www.opengis.net/wmts/1.0';
var OWS_NS = 'http://www.opengis.net/ows/1.1';

function readCoordinates(node) {
  var s = readString(node);
  if (s) {
    return s.split(/\s+/).map(function(v) { return parseFloat(v); });
  }
  return undefined;
}

function readServiceIdentification(node, objectStack) {
  return pushParseAndPop({}, SERVICE_IDENTIFICATION_PARSERS, node, objectStack);
}

function readServiceProvider(node, objectStack) {
  return pushParseAndPop({}, SERVICE_PROVIDER_PARSERS, node, objectStack);
}

function readServiceContact(node, objectStack) {
  return pushParseAndPop({}, SERVICE_CONTACT_PARSERS, node, objectStack);
}

function readContactInfo(node, objectStack) {
  return pushParseAndPop({}, CONTACT_INFO_PARSERS, node, objectStack);
}

function readPhone(node, objectStack) {
  return pushParseAndPop([], PHONE_PARSERS, node, objectStack);
}

function readAddress(node, objectStack) {
  return pushParseAndPop({}, ADDRESS_PARSERS, node, objectStack);
}

function readOperationsMetadata(node, objectStack) {
  return pushParseAndPop({}, OPERATIONS_METADATA_PARSERS, node, objectStack);
}

function readOperation(node, objectStack) {
  var name = node.getAttribute('name');
  return pushParseAndPop({ 'name': name }, OPERATION_PARSERS, node, objectStack);
}

function readDCP(node, objectStack) {
  return pushParseAndPop({}, DCP_PARSERS, node, objectStack);
}

function readHTTP(node, objectStack) {
  return pushParseAndPop({}, HTTP_PARSERS, node, objectStack);
}

function readGetPost(node, objectStack) {
  var href = readHref(node);
  var obj = pushParseAndPop({}, GETPOST_PARSERS, node, objectStack);
  if (isDef(href)) obj['href'] = href;
  var keys = Object.keys(obj);
  if (keys.length === 1 && isDef(obj['href'])) {
    return href;
  }
  return obj;
}

function readConstraint(node, objectStack) {
  var name = node.getAttribute('name');
  return pushParseAndPop({ 'name': name }, CONSTRAINT_PARSERS, node, objectStack);
}

function readAllowedValues(node, objectStack) {
  return pushParseAndPop([], ALLOWED_VALUES_PARSERS, node, objectStack);
}

function readContents(node, objectStack) {
  return pushParseAndPop({}, CONTENT_PARSERS, node, objectStack);
}

function readContentLayer(node, objectStack) {
  return pushParseAndPop({}, LAYER_PARSERS, node, objectStack);
}

function readStyle(node, objectStack) {
  var isDefault = readBooleanString(node.getAttribute('isDefault'));
  var styleObj = pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
  if (isDef(styleObj) && isDef(isDefault)) {
    styleObj['isDefault'] = isDefault;
  }
  return styleObj;
}

function readLegendURL(node, objectStack) {
  var obj = {};
  var format = node.getAttribute('format');
  var href = readHref(node);
  var width = readDecimalString(node.getAttribute('width'));
  var height = readDecimalString(node.getAttribute('height'));
  if (isDef(format)) obj['format'] = format;
  if (isDef(href)) obj['href'] = href;
  if (isDef(width)) obj['width'] = width;
  if (isDef(height)) obj['height'] = height;
  return obj;
}

function readTileMatrixSetLink(node, objectStack) {
  return pushParseAndPop({}, TILE_MATRIX_SET_LINK_PARSERS, node, objectStack);
}

function readTileMatrixSetLimits(node, objectStack) {
  return pushParseAndPop({}, TILE_MATRIX_SET_LIMITS_PARSERS, node, objectStack);
}

function readTileMatrixLimits(node, objectStack) {
  return pushParseAndPop({}, TILE_MATRIX_LIMITS_PARSERS, node, objectStack);
}

function readResourceURL(node, objectStack) {
  var format = node.getAttribute('format');
  var resourceType = node.getAttribute('resourceType');
  var template = node.getAttribute('template');
  var obj = {};
  if (isDef(format)) obj['format'] = format;
  if (isDef(resourceType)) obj['resourceType'] = resourceType;
  if (isDef(template)) obj['template'] = template;
  return obj;
}

function readTileMatrixSet(node, objectStack) {
  return pushParseAndPop({}, TILE_MATRIX_SET_ITEM_PARSERS, node, objectStack);
}

function readTileMatrix(node, objectStack) {
  return pushParseAndPop({}, TILE_MATRIX_PARSERS, node, objectStack);
}

function readWGS84BoundingBox(node, objectStack) {
  var crs = node.getAttribute('crs');
  var obj = pushParseAndPop({}, OWS_BOUNDING_BOX_PARSERS, node, objectStack);
  if (isDef(crs)) obj['crs'] = crs;
  return obj;
}

function readBoundingBox(node, objectStack) {
  var crs = node.getAttribute('crs');
  var obj = pushParseAndPop({}, OWS_BOUNDING_BOX_PARSERS, node, objectStack);
  if (isDef(crs)) obj['crs'] = crs;
  return obj;
}

function readKeywords(node, objectStack) {
  return pushParseAndPop([], KEYWORDS_PARSERS, node, objectStack);
}

function readTileMatrixSetName(node) {
  return readString(node);
}

function readThemes(node, objectStack) {
  return pushParseAndPop([], THEMES_PARSERS, node, objectStack);
}

function readTheme(node, objectStack) {
  return pushParseAndPop({}, THEME_PARSERS, node, objectStack);
}

function readLayerRef(node) {
  return readString(node);
}

function readMetadata(node, objectStack) {
  var href = readHref(node);
  var about = node.getAttribute('about');
  var type = node.getAttributeNS('http://www.w3.org/1999/xlink', 'type');
  var obj = {};
  if (isDef(href)) obj['href'] = href;
  if (isDef(about)) obj['about'] = about;
  if (isDef(type)) obj['type'] = type;
  return obj;
}

var ROOT_NAMESPACE_URIS = [WMTS_NS, OWS_NS];

export var PARSERS = makeParsersNS(
  ROOT_NAMESPACE_URIS, {
    'ServiceIdentification': makeObjectPropertySetter(readServiceIdentification),
    'ServiceProvider': makeObjectPropertySetter(readServiceProvider),
    'OperationsMetadata': makeObjectPropertySetter(readOperationsMetadata),
    'Contents': makeObjectPropertySetter(readContents),
    'Themes': makeObjectPropertySetter(readThemes),
    'ServiceMetadataURL': makeObjectPropertySetter(readHref)
  });

var SERVICE_IDENTIFICATION_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'ServiceType': makeObjectPropertySetter(readString),
    'ServiceTypeVersion': makeObjectPropertySetter(readString),
    'Fees': makeObjectPropertySetter(readString),
    'AccessConstraints': makeObjectPropertySetter(readString)
  });

var SERVICE_PROVIDER_PARSERS = makeParsersNS(
  [OWS_NS], {
    'ProviderName': makeObjectPropertySetter(readString),
    'ProviderSite': makeObjectPropertySetter(readHref),
    'ServiceContact': makeObjectPropertySetter(readServiceContact)
  });

var SERVICE_CONTACT_PARSERS = makeParsersNS(
  [OWS_NS], {
    'IndividualName': makeObjectPropertySetter(readString),
    'PositionName': makeObjectPropertySetter(readString),
    'ContactInfo': makeObjectPropertySetter(readContactInfo)
  });

var CONTACT_INFO_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Phone': makeObjectPropertySetter(readPhone),
    'Address': makeObjectPropertySetter(readAddress)
  });

var PHONE_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Voice': makeObjectPropertySetter(readString),
    'Facsimile': makeObjectPropertySetter(readString)
  });

var ADDRESS_PARSERS = makeParsersNS(
  [OWS_NS], {
    'DeliveryPoint': makeObjectPropertySetter(readString),
    'City': makeObjectPropertySetter(readString),
    'AdministrativeArea': makeObjectPropertySetter(readString),
    'PostalCode': makeObjectPropertySetter(readString),
    'Country': makeObjectPropertySetter(readString),
    'ElectronicMailAddress': makeObjectPropertySetter(readString)
  });

var OPERATIONS_METADATA_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Operation': makeObjectPropertyPusher(readOperation),
    'Parameter': makeObjectPropertyPusher(readConstraint),
    'Constraint': makeObjectPropertyPusher(readConstraint)
  });

var OPERATION_PARSERS = makeParsersNS(
  [OWS_NS], {
    'DCP': makeObjectPropertyPusher(readDCP),
    'Parameter': makeObjectPropertyPusher(readConstraint),
    'Constraint': makeObjectPropertyPusher(readConstraint)
  });

var DCP_PARSERS = makeParsersNS(
  [OWS_NS], {
    'HTTP': makeObjectPropertySetter(readHTTP)
  });

var HTTP_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Get': makeObjectPropertyPusher(readGetPost),
    'Post': makeObjectPropertyPusher(readGetPost)
  });

var GETPOST_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Constraint': makeObjectPropertyPusher(readConstraint)
  });

var CONSTRAINT_PARSERS = makeParsersNS(
  [OWS_NS], {
    'AllowedValues': makeObjectPropertySetter(readAllowedValues)
  });

var ALLOWED_VALUES_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Value': makeArrayPusher(readString)
  });

var CONTENT_PARSERS = makeParsersNS(
  [WMTS_NS], {
    'Layer': makeObjectPropertyPusher(readContentLayer),
    'TileMatrixSet': makeObjectPropertyPusher(readTileMatrixSet)
  });

var LAYER_PARSERS = makeParsersNS(
  [WMTS_NS, OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'WGS84BoundingBox': makeObjectPropertySetter(readWGS84BoundingBox),
    'BoundingBox': makeObjectPropertyPusher(readBoundingBox),
    'Identifier': makeObjectPropertySetter(readString),
    'Metadata': makeObjectPropertyPusher(readMetadata),
    'Style': makeObjectPropertyPusher(readStyle),
    'Format': makeObjectPropertyPusher(readString),
    'InfoFormat': makeObjectPropertyPusher(readString),
    'TileMatrixSetLink': makeObjectPropertyPusher(readTileMatrixSetLink),
    'ResourceURL': makeObjectPropertyPusher(readResourceURL)
  });

var STYLE_PARSERS = makeParsersNS(
  [WMTS_NS, OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Identifier': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'LegendURL': makeObjectPropertyPusher(readLegendURL)
  });

var TILE_MATRIX_SET_LINK_PARSERS = makeParsersNS(
  [WMTS_NS], {
    'TileMatrixSet': makeObjectPropertySetter(readTileMatrixSetName),
    'TileMatrixSetLimits': makeObjectPropertySetter(readTileMatrixSetLimits)
  });

var TILE_MATRIX_SET_LIMITS_PARSERS = makeParsersNS(
  [WMTS_NS], {
    'TileMatrixLimits': makeObjectPropertyPusher(readTileMatrixLimits)
  });

var TILE_MATRIX_LIMITS_PARSERS = makeParsersNS(
  [WMTS_NS], {
    'TileMatrix': makeObjectPropertySetter(readString),
    'MinTileRow': makeObjectPropertySetter(readNonNegativeIntegerString),
    'MaxTileRow': makeObjectPropertySetter(readNonNegativeIntegerString),
    'MinTileCol': makeObjectPropertySetter(readNonNegativeIntegerString),
    'MaxTileCol': makeObjectPropertySetter(readNonNegativeIntegerString)
  });

var TILE_MATRIX_SET_ITEM_PARSERS = makeParsersNS(
  [WMTS_NS, OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'Identifier': makeObjectPropertySetter(readString),
    'Metadata': makeObjectPropertyPusher(readMetadata),
    'SupportedCRS': makeObjectPropertySetter(readString),
    'BoundingBox': makeObjectPropertySetter(readBoundingBox),
    'WellKnownScaleSet': makeObjectPropertySetter(readString),
    'TileMatrix': makeObjectPropertyPusher(readTileMatrix)
  });

var TILE_MATRIX_PARSERS = makeParsersNS(
  [WMTS_NS, OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'Identifier': makeObjectPropertySetter(readString),
    'ScaleDenominator': makeObjectPropertySetter(readDecimal),
    'TopLeftCorner': makeObjectPropertySetter(readCoordinates),
    'TileWidth': makeObjectPropertySetter(readNonNegativeInteger),
    'TileHeight': makeObjectPropertySetter(readNonNegativeInteger),
    'MatrixWidth': makeObjectPropertySetter(readNonNegativeInteger),
    'MatrixHeight': makeObjectPropertySetter(readNonNegativeInteger)
  });

var OWS_BOUNDING_BOX_PARSERS = makeParsersNS(
  [OWS_NS], {
    'LowerCorner': makeObjectPropertySetter(readCoordinates),
    'UpperCorner': makeObjectPropertySetter(readCoordinates)
  });

var KEYWORDS_PARSERS = makeParsersNS(
  [OWS_NS], {
    'Keyword': makeArrayPusher(readString)
  });

var THEMES_PARSERS = makeParsersNS(
  [WMTS_NS], {
    'Theme': makeArrayPusher(readTheme)
  });

var THEME_PARSERS = makeParsersNS(
  [WMTS_NS, OWS_NS], {
    'Title': makeObjectPropertySetter(readString),
    'Abstract': makeObjectPropertySetter(readString),
    'Keywords': makeObjectPropertySetter(readKeywords),
    'Identifier': makeObjectPropertySetter(readString),
    'LayerRef': makeObjectPropertyPusher(readLayerRef),
    'Theme': makeObjectPropertyPusher(readTheme)
  });
