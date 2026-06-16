export interface WMTSCapabilitiesJSON {
  version: string;
  ServiceIdentification: ServiceIdentification;
  ServiceProvider: ServiceProvider;
  OperationsMetadata: OperationsMetadata;
  Contents: Contents;
  Themes: Theme[];
  ServiceMetadataURL: string;
}

export interface ServiceIdentification {
  Title: string;
  Abstract: string;
  Keywords: string[];
  ServiceType: string;
  ServiceTypeVersion: string;
  Fees: string;
  AccessConstraints: string;
}

export interface ServiceProvider {
  ProviderName: string;
  ProviderSite: string;
  ServiceContact: ServiceContact;
}

export interface ServiceContact {
  IndividualName: string;
  PositionName: string;
  ContactInfo: ContactInfo;
}

export interface ContactInfo {
  Phone: Phone;
  Address: Address;
}

export interface Phone {
  Voice: string;
  Facsimile: string;
}

export interface Address {
  DeliveryPoint: string;
  City: string;
  AdministrativeArea: string;
  PostalCode: string;
  Country: string;
  ElectronicMailAddress: string;
}

export interface OperationsMetadata {
  Operation: Operation[];
  Parameter: Constraint[];
  Constraint: Constraint[];
}

export interface Operation {
  name: string;
  DCP: DCP[];
  Parameter: Constraint[];
  Constraint: Constraint[];
}

export interface DCP {
  HTTP: HTTP;
}

export interface HTTP {
  Get: GetPost[] | string;
  Post: GetPost[] | string;
}

export interface GetPost {
  href: string;
  Constraint: Constraint[];
}

export interface Constraint {
  name: string;
  AllowedValues: AllowedValues;
}

export interface AllowedValues {
  Value: string[];
}

export interface Contents {
  Layer: Layer[];
  TileMatrixSet: TileMatrixSet[];
}

export interface Layer {
  Title: string;
  Abstract: string;
  Keywords: string[];
  WGS84BoundingBox: BoundingBox;
  BoundingBox: BoundingBox[];
  Identifier: string;
  Metadata: Metadata[];
  Style: Style[];
  Format: string[];
  InfoFormat: string[];
  TileMatrixSetLink: TileMatrixSetLink[];
  ResourceURL: ResourceURL[];
}

export interface BoundingBox {
  crs: string;
  LowerCorner: number[];
  UpperCorner: number[];
}

export interface Style {
  isDefault: boolean;
  Title: string;
  Identifier: string;
  Abstract: string;
  Keywords: string[];
  LegendURL: LegendURL[];
}

export interface LegendURL {
  format: string;
  href: string;
  width: number;
  height: number;
}

export interface TileMatrixSetLink {
  TileMatrixSet: string;
  TileMatrixSetLimits: TileMatrixSetLimits;
}

export interface TileMatrixSetLimits {
  TileMatrixLimits: TileMatrixLimits[];
}

export interface TileMatrixLimits {
  TileMatrix: string;
  MinTileRow: number;
  MaxTileRow: number;
  MinTileCol: number;
  MaxTileCol: number;
}

export interface ResourceURL {
  format: string;
  resourceType: string;
  template: string;
}

export interface TileMatrixSet {
  Title: string;
  Abstract: string;
  Keywords: string[];
  Identifier: string;
  Metadata: Metadata[];
  SupportedCRS: string;
  BoundingBox: BoundingBox;
  WellKnownScaleSet: string;
  TileMatrix: TileMatrix[];
}

export interface TileMatrix {
  Title: string;
  Abstract: string;
  Keywords: string[];
  Identifier: string;
  ScaleDenominator: number;
  TopLeftCorner: number[];
  TileWidth: number;
  TileHeight: number;
  MatrixWidth: number;
  MatrixHeight: number;
}

export interface Metadata {
  href: string;
  about: string;
  type: string;
}

export interface Theme {
  Title: string;
  Abstract: string;
  Keywords: string[];
  Identifier: string;
  LayerRef: string[];
  Theme: Theme[];
}

export default class WMTS {
  constructor(xmlString?: string | undefined, DOMParser: any);
  version: string;
  _parser: XMLParser;
  _data: string | undefined;
  data(xmlString: string): WMTS;
  toJSON(xmlString?: string | undefined): WMTSCapabilitiesJSON | null;
  parse(xmlString: any): WMTSCapabilitiesJSON;
  readFromDocument(doc: Document): WMTSCapabilitiesJSON | null;
  readFromNode(node: Node): WMTSCapabilitiesJSON;
}

declare class XMLParser {
  constructor(DOMParser: DOMParser);
  _parser: DOMParser;
  toDocument(xmlstring: string): Document;
  getAllTextContent(node: Node, normalizeWhitespace: boolean): string;
}
