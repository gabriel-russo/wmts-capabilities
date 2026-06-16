import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import WMTSCapabilities, { type WMTSCapabilitiesJSON } from '../src/index';

function loadXml(filename: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', filename), 'utf-8');
}

describe('WMTSCapabilities', () => {
  const fixtures = [
    { name: 'anatel-capabilities.xml', version: '1.0.0' },
    { name: 'panorama-capabilities.xml', version: '1.0.0' },
  ] as const;

  for (const fixture of fixtures) {
    describe(fixture.name, () => {
      let json: WMTSCapabilitiesJSON;

      beforeAll(() => {
        const xml = loadXml(fixture.name);
        json = new WMTSCapabilities(undefined, DOMParser).parse(xml)!;
      });

      it('should parse without error', () => {
        expect(json).toBeTruthy();
        expect(typeof json).toBe('object');
      });

      it('should extract version', () => {
        expect(json.version).toBe(fixture.version);
      });

      it('should have ServiceIdentification', () => {
        expect(json.ServiceIdentification).toBeDefined();
        expect(json.ServiceIdentification.Title).toBeDefined();
        expect(json.ServiceIdentification.ServiceType).toBe('OGC WMTS');
        expect(json.ServiceIdentification.ServiceTypeVersion).toBe('1.0.0');
      });

      it('should have ServiceProvider', () => {
        expect(json.ServiceProvider).toBeDefined();
        expect(json.ServiceProvider.ProviderName).toBeDefined();
      });

      it('should have OperationsMetadata', () => {
        expect(json.OperationsMetadata).toBeDefined();
        expect(Array.isArray(json.OperationsMetadata.Operation)).toBe(true);
        expect(json.OperationsMetadata.Operation.length).toBeGreaterThan(0);
      });

      it('should have GetCapabilities operation', () => {
        const op = json.OperationsMetadata.Operation.find((o) => o.name === 'GetCapabilities');
        expect(op).toBeDefined();
        expect(op!.DCP).toBeDefined();
        expect(op!.DCP.length).toBeGreaterThan(0);
      });

      it('should have GetTile operation', () => {
        const op = json.OperationsMetadata.Operation.find((o) => o.name === 'GetTile');
        expect(op).toBeDefined();
      });

      it('should have Contents with Layers', () => {
        expect(json.Contents).toBeDefined();
        expect(Array.isArray(json.Contents.Layer)).toBe(true);
        expect(json.Contents.Layer.length).toBeGreaterThan(0);
      });

      it('should have well-formed layers', () => {
        const firstLayer = json.Contents.Layer[0];
        expect(firstLayer.Identifier).toBeDefined();
        expect(firstLayer.Title).toBeDefined();
        expect(Array.isArray(firstLayer.Style)).toBe(true);
        expect(Array.isArray(firstLayer.Format)).toBe(true);
        expect(firstLayer.Format.length).toBeGreaterThan(0);
      });

      it('should have TileMatrixSetLink in layers', () => {
        const firstLayer = json.Contents.Layer[0];
        expect(Array.isArray(firstLayer.TileMatrixSetLink)).toBe(true);
        expect(firstLayer.TileMatrixSetLink.length).toBeGreaterThan(0);
        expect(firstLayer.TileMatrixSetLink[0].TileMatrixSet).toBeDefined();
      });

      it('should have TileMatrixSet if present', () => {
        if (json.Contents.TileMatrixSet.length > 0) {
          const tms = json.Contents.TileMatrixSet[0];
          expect(tms.Identifier).toBeDefined();
          expect(Array.isArray(tms.TileMatrix)).toBe(true);
          if (tms.TileMatrix.length > 0) {
            const tm = tms.TileMatrix[0];
            expect(tm.Identifier).toBeDefined();
            expect(typeof tm.ScaleDenominator).toBe('number');
            expect(Array.isArray(tm.TopLeftCorner)).toBe(true);
            expect(typeof tm.TileWidth).toBe('number');
            expect(typeof tm.TileHeight).toBe('number');
            expect(typeof tm.MatrixWidth).toBe('number');
            expect(typeof tm.MatrixHeight).toBe('number');
          }
        }
      });

      it('toJSON should work', () => {
        const xml = loadXml(fixture.name);
        const json2 = new WMTSCapabilities(xml, DOMParser).toJSON();
        expect(json2).toBeTruthy();
        expect(json2!.version).toBe(fixture.version);
      });

      it('should parse with setXml + toJSON', () => {
        const xml = loadXml(fixture.name);
        const parser = new WMTSCapabilities(undefined, DOMParser);
        const result = parser.setXml(xml).toJSON();
        expect(result).toBeTruthy();
        expect(result!.version).toBe(fixture.version);
      });

      it('should parse with readFromDocument', () => {
        const xml = loadXml(fixture.name);
        const parser = new WMTSCapabilities(undefined, DOMParser);
        const result = parser.parse(xml);
        expect(result).toBeTruthy();
        expect(result!.version).toBe(fixture.version);
      });

      it('should have ResourceURL in layers', () => {
        const layer = json.Contents.Layer[0];
        if (layer.ResourceURL && layer.ResourceURL.length > 0) {
          const resource = layer.ResourceURL[0];
          expect(resource.format).toBeDefined();
          expect(resource.resourceType).toBeDefined();
          expect(resource.template).toBeDefined();
        }
      });

      it('should have Format in layers', () => {
        const layer = json.Contents.Layer[0];
        expect(layer.Format.length).toBeGreaterThan(0);
        expect(typeof layer.Format[0]).toBe('string');
      });
    });
  }
});
