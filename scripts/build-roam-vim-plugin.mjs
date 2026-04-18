import {build} from 'esbuild'
import {copyFile, mkdir, rm} from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const extensionJs = path.join(root, 'extension.js')
const readme = path.join(root, 'README.md')
const distDir = path.join(root, 'dist')
const distExtensionJs = path.join(distDir, 'extension.js')
const distReadme = path.join(distDir, 'README.md')

await rm(extensionJs, {force: true})
await rm(distDir, {force: true, recursive: true})
await mkdir(distDir, {recursive: true})

await build({
    absWorkingDir: root,
    bundle: true,
    entryPoints: ['src/ts/roam-vim-plugin/index.ts'],
    format: 'esm',
    minify: false,
    outfile: extensionJs,
    platform: 'browser',
    sourcemap: false,
    target: ['es2022'],
    tsconfig: path.join(root, 'tsconfig.json'),
})

await copyFile(extensionJs, distExtensionJs)
await copyFile(readme, distReadme)
