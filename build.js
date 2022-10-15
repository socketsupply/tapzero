#!/usr/bin/env node
// @ts-check
const path = require('path')
const esbuild = require('esbuild')

const debug = process.argv.includes('--debug')

async function main () {
  await build('index.js')
}

main()
  .then(() => console.log('done building'))
  .catch(err => console.log('err', err))

/**
 * @param {string} srcFile Path to source file
 * @returns {Promise<[
 *   import('esbuild').BuildResult,
 *   import('esbuild').BuildResult
 * ]>} Promise for building esm and cjs files
 */
function build (srcFile) {
  const root = __dirname

  return Promise.all([
    esbuild.build({
      entryPoints: [path.join(root, 'index.js')],
      bundle: true,
      keepNames: true,
      minify: false,
      format: 'esm',
      define: { global: 'window' },
      sourcemap: debug ? 'inline' : undefined,
      outfile: path.join(root, 'dist',
        path.basename(srcFile).replace('.js', '.esm.js')),
      platform: 'browser'
    }),

    esbuild.build({
      entryPoints: [path.join(root, 'index.js')],
      bundle: true,
      keepNames: true,
      minify: false,
      format: 'cjs',
      define: { global: 'window' },
      sourcemap: debug ? 'inline' : undefined,
      outfile: path.join(root, 'dist/', path.basename(srcFile)),
      platform: 'browser'
    })
  ])
}
