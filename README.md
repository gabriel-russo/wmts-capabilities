# wmts-capabilities - Parse Web Map Tile Service Capabilities

Parse a [WMTS](https://www.ogc.org/standard/wmts/) `Capabilities` XML response into a plain JavaScript object.

```js
const capabilities = new WMTSCapabilities(xml).toJSON();
// { version, ServiceIdentification, ServiceProvider, Contents, ... }
```

## Install

```bash
npm install wmts-capabilities
```

## WMTSCapabilities

The library exports a single class.

### `new WMTSCapabilities(xml?, domParser?)`

| Param       | Type     | Required | Description                                      |
|------------|----------|----------|--------------------------------------------------|
| `xml`      | `string` | no       | The WMTS XML. Can be provided later.              |
| `domParser`| instance | no       | A `DOMParser` instance. Auto-detected in browsers.|

```ts
import WMTSCapabilities from "wmts-capabilities";

// Browser — DOMParser is auto-detected
const caps = new WMTSCapabilities(xml).toJSON();

// Node.js — pass an instance from @xmldom/xmldom
import { DOMParser } from '@xmldom/xmldom';

const caps = new WMTSCapabilities(xml, new DOMParser()).toJSON();

// No XML yet — provide it later
const parser = new WMTSCapabilities(undefined, new DOMParser());

const caps = parser.setXml(xml).toJSON();
```

### `.toJSON(xml?)` → `WMTSCapabilitiesJSON | null`

Parses the XML and returns the result. Throws if no XML was provided.

```js
// XML from constructor
const caps = new WMTSCapabilities(xml, new DOMParser()).toJSON();

// XML passed to toJSON
const caps = new WMTSCapabilities(undefined, new DOMParser()).toJSON(xml);
```

### `.parse(xml)` → `WMTSCapabilitiesJSON | null`

Same as `toJSON(xml)` — the `xml` argument is required here.

```js
const parser = new WMTSCapabilities(undefined, new DOMParser());
const caps1 = parser.parse(xml1);
const caps2 = parser.parse(xml2); // same instance, different XML
```

### `.setXml(xml)` → `this`

Stores XML for later use. Returns `this` for chaining.

```js
const caps = new WMTSCapabilities(undefined, new DOMParser())
  .setXml(fetchResult)
  .toJSON();
```

### `.readFromDocument(doc)` → `WMTSCapabilitiesJSON | null`

Parse an already-parsed DOM `Document`.

```js
const doc = new DOMParser().parseFromString(xml, 'application/xml');
const caps = new WMTSCapabilities(undefined, new DOMParser()).readFromDocument(doc);
```

### `.version` → `string | undefined`

After parsing, contains the WMTS version (e.g. `"1.0.0"`).

```js
const caps = parser.parse(xml);
console.log(caps.version); // "1.0.0"
```

---

## Working with the result

### Top-level shape

```ts
{
  version: string;
  ServiceIdentification: { Title, ServiceType, ServiceTypeVersion, ... };
  ServiceProvider:      { ProviderName, ServiceContact, ... };
  OperationsMetadata:   { Operation: [{ name, DCP }] };
  Contents:             { Layer: [...], TileMatrixSet: [...] };
  Themes?:              [{ Identifier, LayerRef, Theme? }];
  ServiceMetadataURL?:  string;
}
```

### Iterate over layers

```js
const caps = parser.parse(xml);

for (const layer of caps.Contents.Layer) {
  console.log(layer.Identifier);
  console.log(`  ${layer.Title}`);
  console.log(`  Formats: ${layer.Format.join(', ')}`);
  console.log(`  Styles: ${layer.Style.length}`);
}
```

### Find a layer

```js
const layer = caps.Contents.Layer.find(
  (l) => l.Identifier === 'my_layer'
);

if (layer) {
  // Layer found
  console.log(layer.WGS84BoundingBox);
  console.log(layer.ResourceURL);
}
```

### Get the tile URL template

```js
const tileResource = caps.Contents.Layer[0]
  .ResourceURL
  .find((r) => r.resourceType === 'tile');

if (tileResource) {
  // https://tiles.example.com/.../{TileMatrix}/{TileCol}/{TileRow}.png
  console.log(tileResource.template);
}
```

### Read the tile matrix set

```js
for (const tms of caps.Contents.TileMatrixSet) {
  console.log(`${tms.Identifier} (${tms.SupportedCRS})`);

  for (const level of tms.TileMatrix) {
    console.log(
      `  Level ${level.Identifier}: ` +
      `${level.MatrixWidth}x${level.MatrixHeight} tiles ` +
      `@ ${level.TileWidth}x${level.TileHeight}px`
    );
  }
}
```

### Get operation endpoints

```js
const getTile = caps.OperationsMetadata.Operation.find(
  (op) => op.name === 'GetTile'
);

if (getTile) {
  const endpoint = getTile.DCP[0].HTTP.Get[0];
  console.log(typeof endpoint === 'string' ? endpoint : endpoint.href);
}
```

### Get the bounding box

```js
const bbox = caps.Contents.Layer[0].WGS84BoundingBox;

if (bbox) {
  const [west, south] = bbox.LowerCorner;
  const [east, north] = bbox.UpperCorner;
  console.log(`Bounds: ${west},${south} ${east},${north}`);
}
```

### Get all unique formats

```js
const formats = [...new Set(
  caps.Contents.Layer.flatMap((l) => l.Format)
)];
// ["image/png", "image/jpeg", "image/tiff"]
```

---

## TypeScript

The `WMTSCapabilitiesJSON` type is exported:

```ts
import WMTSCapabilities, { type WMTSCapabilitiesJSON } from 'wmts-capabilities';

const caps: WMTSCapabilitiesJSON = new WMTSCapabilities(xml, new DOMParser()).toJSON()!;
```

All nested types (`Layer`, `TileMatrixSet`, `Style`, etc.) are also available:

```ts
import type { Layer, TileMatrixSet, Operation, BoundingBox } from 'wmts-capabilities';

function getTileUrl(layer: Layer): string | undefined {
  const tile = layer.ResourceURL.find((r) => r.resourceType === 'tile');
  return tile?.template;
}
```

---

## CLI

```bash
npm install --global wmts-capabilities

cat capabilities.xml | wmtscapabilities > output.json
wmtscapabilities capabilities.xml > output.json
wmtscapabilities --version
wmtscapabilities --help
```

---

## Error handling

```js
const parser = new WMTSCapabilities(undefined, new DOMParser());

try {
  const caps = parser.parse(xml);
  // ...
} catch (err) {
  console.error('Parse failed:', err.message);
}
```

The constructor throws if no DOMParser is available (e.g. Node.js without `@xmldom/xmldom`). `toJSON()` and `parse()` throw if no XML was provided. Malformed XML throws from the underlying DOMParser.

---

## Reuse the parser

Create one instance and parse multiple responses:

```js
const parser = new WMTSCapabilities(undefined, new DOMParser());

const capsA = parser.parse(xmlA);
const capsB = parser.setXml(xmlB).toJSON();
const capsC = parser.parse(xmlC);
```
