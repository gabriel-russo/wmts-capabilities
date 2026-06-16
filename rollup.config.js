import buble from "@rollup/plugin-buble";
import compiler from "@ampproject/rollup-plugin-closure-compiler";
import { name, description, license, version } from "./package.json";

const banner = `
/**
 * ${name} @${version}
 * @description ${description}
 * @license ${license}
 * @preserve
 */
`;

export default [
  {
    input: "src/index.js",
    output: {
      file: "dist/wmts-capabilities.js",
      format: "umd",
      name: "WMTSCapabilities",
      sourcemap: true,
      banner,
    },
    plugins: [buble()],
  },
  {
    input: "src/index.js",
    output: {
      file: "dist/wmts-capabilities.mjs",
      format: "esm",
      name: "WMTSCapabilities",
      sourcemap: true,
      banner,
    },
  },
  {
    input: "src/index.js",
    output: {
      file: "dist/wmts-capabilities.min.js",
      format: "umd",
      name: "WMTSCapabilities",
      sourcemap: true,
      banner,
    },
    plugins: [buble(), compiler({})],
  },
];
