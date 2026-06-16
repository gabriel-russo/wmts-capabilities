# WMTS `GetCapabilities` parser
[![npm version](https://badge.fury.io/js/wmts-capabilities.svg)](http://badge.fury.io/js/wmts-capabilities)

Parses [WMTS](http://en.wikipedia.org/wiki/Web_Map_Tile_Service) capabilities XML format to JSON.
Based on the [wms-capabilities](https://github.com/w8r/wms-capabilities) library.

## Usage

### ES
```
npm install wmts-capabilities --save
```
```js
import WMTSCapabilities from 'wmts-capabilities';
new WMTSCapabilities().parse(xmlString);
new WMTSCapabilities(xmlString).toJSON();
new WMTSCapabilities().readFromDocument(xmldoc);
```

### Browser
```html
<script src="path/to/wmts-capabilities.min.js"></script>
```
```js
new WMTSCapabilities().parse(xmlString);
```

### Node
Requires `xmldom` to traverse XML
```js
import xmldom from 'xmldom';
import WMTSCapabilities from 'wmts-capabilities';
new WMTSCapabilities(xmlString, xmldom.DOMParser).toJSON();
```

### Command-line
```
npm install -g wmts-capabilities
```
```
cat capabilities.xml | wmtscapabilities > out.json
wmtscapabilities capabilities.xml > out.json
```
