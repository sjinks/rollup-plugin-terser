# rollup-plugin-terser

[![Build and Test](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/ci.yml/badge.svg)](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sjinks_rollup-plugin-terser&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=sjinks_rollup-plugin-terser)
[![CodeQL Analysis](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/codeql-analysis.yml)
[![Dependency Review](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/dependency-review.yml)

A Rollup plugin to minify the generated bundle with Terser.

This is a complete rewrite of [TrySound/rollup-plugin-terser](https://github.com/TrySound/rollup-plugin-terser).

Main differences:
  * the code is written in TypeScript;
  * this plugin supports both Rollup 2 and Rollup 3;
  * the implementation is more lightweight and probably less resource-consuming, but it does not use workers (therefore, it could be slower).

## Installation

```bash
npm i -D @wwa/rollup-plugin-terser
```

## Usage

```js
import { rollup } from 'rollup';
import { terser } from '@wwa/rollup-plugin-terser';

rollup({
  input: 'file.js',
  plugins: [
    terser(),
  ],
});
```

`terser` accepts an optional `options` parameter, which is the [MinifyOptions object](https://github.com/terser/terser#minify-options).

The plugin automatically sets the following options:
  * `module: true` if the output format is `esm` or `es`;
  * `toplevel: true` if the output format is `cjs`;
  * `sourcemap` is always inferred from rollup's options.

