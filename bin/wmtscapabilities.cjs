#!/usr/bin/env node

var xmldom = require('@xmldom/xmldom');
var WMTSCapabilities = require('../dist/wmts-capabilities.umd.cjs');
var fs = require('fs');
var path = require('path');

var pkg = require('../package.json');
var xml = '';

var args = process.argv.slice(2);
var arg = args[0];

var stream = process.stdin;

if (arg === '--version') {
  console.log(pkg.version);
  process.exit(0);
} else if (arg === '--help') {
  console.log('\n WMTS Capabilities converter', pkg.version, '\n');
  console.log('  $ cat capabilities.xml | wmtscapabilities > out.json');
  console.log('  $ wmtscapabilities capabilities.xml > out.json\n');
  process.exit(0);
} else if (arg) {
  stream = fs.createReadStream(path.join(process.cwd(), arg));
}

stream.on('data', function (data) {
  xml += data;
});

stream.resume();

stream.on('end', function () {
  try {
    var WMTS = WMTSCapabilities.default || WMTSCapabilities;
    var parser = new WMTS(undefined, xmldom.DOMParser);
    var json = parser.parse(xml);
    if (json === null) {
      console.error('Error: failed to parse XML');
      process.exit(1);
    }
    process.stdout.write(JSON.stringify(json, null, 2) + '\n');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
});
