"use strict";

import tape from 'tape';
import WMTSCapabilities from '../dist/wmts-capabilities';
import fs from 'fs';
import path from 'path';

import { DOMParser } from 'xmldom';

tape('WMTSCapabilities', function(t) {

  t.test('capabilities.xml', function(t) {
    var url = path.join(process.cwd(), './test/fixtures/panorama-capabilities.xml');
    var xml = fs.readFileSync(url, { encoding: 'utf-8' });
    var json = new WMTSCapabilities(undefined, DOMParser).parse(xml);

    t.ok(json, 'got result');
    t.equal(typeof json, 'object', 'parsed');
    t.equal(json.version, '1.0.0', 'version');
    t.ok(json.ServiceIdentification, 'has ServiceIdentification');
    t.equal(json.ServiceIdentification.Title, 'GeoServer Web Map Tile Service', 'service title');
    t.equal(json.ServiceIdentification.ServiceType, 'OGC WMTS', 'service type');
    t.equal(json.ServiceIdentification.ServiceTypeVersion, '1.0.0', 'service type version');
    t.ok(json.ServiceProvider, 'has ServiceProvider');
    t.equal(json.ServiceProvider.ProviderName, 'http://geoserver.org/com', 'provider name');
    t.ok(json.OperationsMetadata, 'has OperationsMetadata');
    t.ok(Array.isArray(json.OperationsMetadata.Operation), 'operations is array');
    t.ok(json.Contents, 'has Contents');
    t.ok(Array.isArray(json.Contents.Layer), 'Contents.Layer is array');
    t.ok(json.Contents.Layer.length > 0, 'has layers');
    t.ok(json.Contents.Layer[0].Identifier, 'first layer has Identifier');
    t.ok(json.Contents.Layer[0].TileMatrixSetLink, 'first layer has TileMatrixSetLink');
    t.ok(json.Contents.Layer[0].Style, 'first layer has Style');
    t.ok(json.Contents.Layer[0].Format, 'first layer has Format');
    t.ok(json.Contents.Layer[0].ResourceURL, 'first layer has ResourceURL');

    var getTileOp = json.OperationsMetadata.Operation.find(function(op) {
      return op.name === 'GetTile';
    });

    t.ok(getTileOp, 'has GetTile operation');

    t.end();
  });

  t.test('capabilities.xml toJSON', function(t) {
    var url = path.join(process.cwd(), './test/fixtures/panorama-capabilities.xml');
    var xml = fs.readFileSync(url, { encoding: 'utf-8' });
    var json = new WMTSCapabilities(xml, DOMParser).toJSON();

    t.ok(json, 'got result');
    t.equal(typeof json, 'object', 'parsed');
    t.equal(json.version, '1.0.0', 'version');
    t.end();
  });

  t.end();
});
