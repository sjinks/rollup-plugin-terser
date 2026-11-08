import { deepEqual, equal, fail, match, ok } from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { OutputChunk, Plugin, rollup } from 'rollup';
import { terser } from '../src';

let consoleWarnSpy: ReturnType<typeof mock.method>;
let consoleErrorSpy: ReturnType<typeof mock.method>;

const emptyFunction = (): void => {
    /* Intentionally empty */
};

beforeEach(() => {
    consoleWarnSpy = mock.method(global.console, 'warn', emptyFunction);
    consoleErrorSpy = mock.method(global.console, 'error', emptyFunction);
});

afterEach(() => {
    mock.restoreAll();
});

void test('minify', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/unminified.js',
        plugins: [terser()],
    });

    const result = await bundle.generate({ format: 'cjs' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');

    ok(!output.map);
});

void test('minify via terser options', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/empty.js',
        plugins: [terser({ output: { comments: 'all' } })],
    });

    const result = await bundle.generate({
        banner: '/* package name */',
        format: 'cjs',
    });

    equal(result.output.length, 1);
    const [output] = result.output;

    equal(output.code, '/* package name */\n"use strict";\n');
    ok(!output.map);
    ok(consoleWarnSpy.mock.callCount() > 0);
});

void test('minify multiple outputs', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/unminified.js',
        plugins: [terser()],
    });

    const [bundle1, bundle2] = await Promise.all([
        bundle.generate({ format: 'cjs' }),
        bundle.generate({ format: 'es' }),
    ]);

    const [output1] = bundle1.output;
    const [output2] = bundle2.output;

    equal(output1.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
    equal(output2.code, 'window.a=5,window.a<3&&console.log(4);\n');
});

void test('minify esm module', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/plain-file.js',
        plugins: [terser()],
    });

    const result = await bundle.generate({ format: 'esm' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, 'console.log("bar");\n');
});

void test('minify esm module with disabled module option', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/plain-file.js',
        plugins: [terser({ module: false })],
    });

    const result = await bundle.generate({ format: 'esm' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, 'const foo="bar";console.log(foo);\n');
});

void test('minify cjs module', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/plain-file.js',
        plugins: [terser()],
    });

    const result = await bundle.generate({ format: 'cjs' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";console.log("bar");\n');
});

void test('minify cjs module with disabled toplevel option', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/plain-file.js',
        plugins: [terser({ toplevel: false })],
    });

    const result = await bundle.generate({ format: 'cjs' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";const foo="bar";console.log(foo);\n');
});

void test('minify with sourcemaps', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/sourcemap.js',
        plugins: [terser()],
    });

    const result = await bundle.generate({ format: 'cjs', sourcemap: true });
    // result.output.length is 1 for Rollup 2 and is 2 for Rollup 3 ([{ name: 'sourcemap' }, { fileName: 'sourcemap.js.map' }])
    const [output] = result.output;
    equal(output.map?.mappings, 'aAEAA,QAAQC,ICFO');
    deepEqual(output.map.names, ['console', 'log']);
    deepEqual(output.map.sources, ['test/fixtures/sourcemap.js', 'test/fixtures/export-number.js']);
    equal(output.map.file, 'sourcemap.js');
    equal(output.map.version, 3);
});

void test('work with sourcemap: "inline"', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/sourcemap.js',
        plugins: [terser()],
    });

    const result = await bundle.generate({ format: 'cjs', sourcemap: 'inline' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.map?.mappings, 'aAEAA,QAAQC,ICFO');
    deepEqual(output.map.names, ['console', 'log']);
    deepEqual(output.map.sources, ['test/fixtures/sourcemap.js', 'test/fixtures/export-number.js']);
    equal(output.map.file, 'sourcemap.js');
    equal(output.map.version, 3);
});

void test('throw error on terser fail', async () => {
    try {
        const bundle = await rollup({
            input: 'test/fixtures/failed.js',
            plugins: [
                {
                    name: 'test',
                    renderChunk: () => ({ code: 'var = 1' }),
                } as Plugin,
                terser(),
            ],
        });

        await bundle.generate({ format: 'esm' });
        fail('Expected minification to fail');
    } catch (error) {
        match((error as Error).toString(), /Name expected/u);
    }

    ok(consoleWarnSpy.mock.callCount() > 0);
    ok(consoleErrorSpy.mock.callCount() > 0);
    ok(consoleErrorSpy.mock.calls.some(({ arguments: args }) => String(args[0]).includes('var = 1')));
});

void test('throw error on terser fail with multiple outputs', async () => {
    try {
        const bundle = await rollup({
            input: 'test/fixtures/failed.js',
            plugins: [
                {
                    name: 'test',
                    renderChunk: () => ({ code: 'var = 1' }),
                } as Plugin,
                terser(),
            ],
        });

        await Promise.all([bundle.generate({ format: 'cjs' }), bundle.generate({ format: 'esm' })]);
        fail('Expected minification to fail');
    } catch (error) {
        match((error as Error).toString(), /Name expected/u);
    }

    ok(consoleWarnSpy.mock.callCount() > 0);
    ok(consoleErrorSpy.mock.callCount() > 0);
});

void test('works with code splitting', async () => {
    const bundle = await rollup({
        input: ['test/fixtures/chunk-1.js', 'test/fixtures/chunk-2.js'],
        plugins: [terser()],
    });

    const { output } = await bundle.generate({ format: 'esm' });
    const newOutput: Record<string, Partial<OutputChunk>> = {};
    output.forEach((out) => {
        const value: Partial<OutputChunk> = { ...out } as OutputChunk;
        delete value.modules;
        delete value.facadeModuleId;
        delete value.importedBindings;
        delete value.moduleIds;
        newOutput[out.fileName] = value;
    });

    deepEqual(newOutput, {
        'chunk-1.js': {
            code: 'console.log("chunk-1");\n',
            dynamicImports: [],
            exports: [],
            fileName: 'chunk-1.js',
            implicitlyLoadedBefore: [],
            imports: [],
            isDynamicEntry: false,
            isEntry: true,
            isImplicitEntry: false,
            map: null,
            name: 'chunk-1',
            preliminaryFileName: 'chunk-1.js',
            referencedFiles: [],
            sourcemapFileName: null,
            type: 'chunk',
        },
        'chunk-2.js': {
            code: 'console.log("chunk-2");\n',
            dynamicImports: [],
            exports: [],
            fileName: 'chunk-2.js',
            implicitlyLoadedBefore: [],
            imports: [],
            isDynamicEntry: false,
            isEntry: true,
            isImplicitEntry: false,
            map: null,
            name: 'chunk-2',
            preliminaryFileName: 'chunk-2.js',
            referencedFiles: [],
            sourcemapFileName: null,
            type: 'chunk',
        },
    });
});

void test('allow to pass not string values to worker', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/unminified.js',
        plugins: [terser({ mangle: { properties: { regex: /^_/u } } })],
    });

    const result = await bundle.generate({ format: 'cjs' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
});

void test('allow classic function definitions passing to worker', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/commented.js',
        plugins: [
            terser({
                mangle: { properties: { regex: /^_/u } },
                output: {
                    comments: function (node, comment) {
                        if (comment.type === 'comment2') {
                            // multiline comment
                            return /@preserve|@license|@cc_on|^!/iu.test(comment.value);
                        }
                        return false;
                    },
                },
            }),
        ],
    });

    const result = await bundle.generate({ format: 'cjs', compact: true });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);');
});

void test('allow method shorthand definitions passing to worker', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/commented.js',
        plugins: [
            terser({
                mangle: { properties: { regex: /^_/u } },
                output: {
                    comments(node, comment) {
                        if (comment.type === 'comment2') {
                            // multiline comment
                            return /@preserve|@license|@cc_on|^!/iu.test(comment.value);
                        }
                        return false;
                    },
                },
            }),
        ],
    });

    const result = await bundle.generate({ format: 'cjs', compact: true });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";window.a=5,\n/* @preserve this comment */\nwindow.a<3&&console.log(4);');
});

void test('allow arrow function definitions passing to worker', async () => {
    const bundle = await rollup({
        input: 'test/fixtures/unminified.js',
        plugins: [
            terser({
                mangle: { properties: { regex: /^_/u } },
                output: {
                    comments: (node, comment) => {
                        if (comment.type === 'comment2') {
                            // multiline comment
                            return /@preserve|@license|@cc_on|^!/iu.test(comment.value);
                        }
                        return false;
                    },
                },
            }),
        ],
    });

    const result = await bundle.generate({ format: 'cjs' });
    equal(result.output.length, 1);

    const [output] = result.output;
    equal(output.code, '"use strict";window.a=5,window.a<3&&console.log(4);\n');
});

void test('terser accepts the nameCache option', async () => {
    const nameCache = {
        props: {
            props: {
                $_priv: 'custom',
            },
        },
    };

    const bundle = await rollup({
        input: 'test/fixtures/properties.js',
        plugins: [
            terser({
                mangle: {
                    properties: {
                        regex: /^_/u,
                    },
                },
                nameCache,
            }),
        ],
    });

    const result = await bundle.generate({ format: 'es' });
    equal(result.output[0].code.trim(), `console.log({foo:1,custom:2});`);
});

void test('terser updates the nameCache object', async () => {
    const nameCache = {
        props: {
            props: {
                $_priv: 'f',
            },
        },
    };

    const bundle = await rollup({
        input: 'test/fixtures/properties.js',
        plugins: [
            terser({
                mangle: {
                    properties: {
                        regex: /./u,
                    },
                },
                nameCache,
            }),
        ],
    });

    const result = await bundle.generate({ format: 'es' });
    equal(result.output[0].code.trim(), `console.log({o:1,f:2});`);
    deepEqual(nameCache, {
        props: {
            props: {
                $_priv: 'f',
                $foo: 'o',
            },
        },
        vars: {
            props: {},
        },
    });
});

void test('omits populates an empty nameCache object', async () => {
    const nameCache = {};
    const bundle = await rollup({
        input: 'test/fixtures/properties-and-locals.js',
        plugins: [
            terser({
                mangle: {
                    properties: {
                        regex: /./u,
                    },
                },
                nameCache,
            }),
        ],
    });

    const result = await bundle.generate({ format: 'es' });
    equal(result.output[0].code.trim(), `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`);
    deepEqual(nameCache, {
        props: {
            props: {
                $_priv: 'i',
                $foo: 'o',
            },
        },
        vars: {
            props: {},
        },
    });
});

// Note: nameCache.vars never gets populated, but this is a Terser issue.
// Here we're just testing that an empty vars object doesn't get added to nameCache if it wasn't there previously.
void test('terser preserve vars in nameCache when provided', async () => {
    const nameCache = {
        vars: {
            props: {},
        },
    };

    const bundle = await rollup({
        input: 'test/fixtures/properties-and-locals.js',
        plugins: [
            terser({
                mangle: {
                    properties: {
                        regex: /./u,
                    },
                },
                nameCache,
            }),
        ],
    });

    const result = await bundle.generate({ format: 'es' });
    equal(result.output[0].code.trim(), `console.log({o:1,i:2},function o(n){return n>0?o(n-1):n}(10));`);
    deepEqual(nameCache, {
        props: {
            props: {
                $_priv: 'i',
                $foo: 'o',
            },
        },
        vars: {
            props: {},
        },
    });
});
