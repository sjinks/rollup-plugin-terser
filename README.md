# rollup-plugin-terser

[![Build and Test](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/sjinks/rollup-plugin-terser/actions/workflows/ci.yml?query=branch%3Amaster)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sjinks_rollup-plugin-terser&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=sjinks_rollup-plugin-terser)

A Rollup plugin to minify the generated bundle with Terser.

This is a complete rewrite of [TrySound/rollup-plugin-terser](https://github.com/TrySound/rollup-plugin-terser).

The plugin is written in TypeScript, supports Rollup 2, 3, and 4, and runs Terser without worker processes.

## Installation

Requires Rollup 2, 3, or 4 and Node.js 22.18 or later in the 22.x series, or Node.js 24.11 or later.

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

`terser` accepts an optional [Terser minify options](https://github.com/terser/terser#minify-options) object, except for `sourceMap`, which is controlled by Rollup's output options.

The plugin defaults `module` to `true` for `esm` and `es` output, and `toplevel` to `true` for `cjs` output. You can override either default in the options passed to `terser`. Source map generation follows Rollup's `output.sourcemap` option.

