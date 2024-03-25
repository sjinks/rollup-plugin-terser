import { codeFrameColumns } from '@babel/code-frame';
import type { NormalizedOutputOptions, Plugin, RenderedChunk } from 'rollup';
import { MinifyOptions, minify } from 'terser';

export type Options = Omit<MinifyOptions, 'sourceMap'>;

interface TesrerError extends Error {
    line: number;
    col: number;
}

function buildOptions(pluginOptions: Options, outputOptions: NormalizedOutputOptions): MinifyOptions {
    const options: MinifyOptions = {};

    if (/^esm?$/u.test(outputOptions.format)) {
        options.module = true;
    }

    if (outputOptions.format === 'cjs') {
        options.toplevel = true;
    }

    return {
        ...options,
        ...pluginOptions,
        sourceMap: outputOptions.sourcemap === true || typeof outputOptions.sourcemap === 'string',
    };
}

export function terser(pluginOptions: Options = {}): Plugin {
    return {
        name: 'terser',
        renderChunk(code: string, _chunk: RenderedChunk, outputOptions: NormalizedOutputOptions) {
            const options = buildOptions(pluginOptions, outputOptions);
            return minify(code, options)
                .then((result) => {
                    if (options.nameCache) {
                        pluginOptions.nameCache = { ...options.nameCache };
                    }

                    return {
                        code: result.code,
                        map: result.map,
                    };
                })
                .catch((e: unknown) => {
                    const error = e as TesrerError;
                    const { message, line, col: column } = error;
                    console.error(codeFrameColumns(code, { start: { line, column } }, { message }));
                    throw error;
                });
        },
    } as Plugin;
}
