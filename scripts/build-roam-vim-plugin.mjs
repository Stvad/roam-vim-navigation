import {build} from 'esbuild'
import {copyFile, mkdir, rm} from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const extensionJs = path.join(root, 'extension.js')
const readme = path.join(root, 'README.md')
const distDir = path.join(root, 'dist')
const distExtensionJs = path.join(distDir, 'extension.js')
const distReadme = path.join(distDir, 'README.md')

const RUNTIME_MODULE_NAMESPACE = 'roam-runtime'
const reactModuleId = 'roam-runtime:react'
const reactDomModuleId = 'roam-runtime:react-dom'

const reactModuleSource = `
const React = window.React

if (!React) {
    throw new Error('Roam runtime did not provide window.React')
}

module.exports = React
`

const reactDomModuleSource = `
const ReactDOM = window.ReactDOM

if (!ReactDOM) {
    throw new Error('Roam runtime did not provide window.ReactDOM')
}

module.exports = ReactDOM
`

await rm(extensionJs, {force: true})
await rm(distDir, {force: true, recursive: true})
await mkdir(distDir, {recursive: true})

await build({
    absWorkingDir: root,
    bundle: true,
    entryPoints: ['src/ts/roam-vim-plugin/index.tsx'],
    format: 'esm',
    minify: false,
    outfile: extensionJs,
    platform: 'browser',
    plugins: [
        {
            name: 'roam-runtime-dependencies',
            setup(build) {
                build.onResolve({filter: /^react$/}, () => ({
                    namespace: RUNTIME_MODULE_NAMESPACE,
                    path: reactModuleId,
                }))
                build.onResolve({filter: /^react-dom$/}, () => ({
                    namespace: RUNTIME_MODULE_NAMESPACE,
                    path: reactDomModuleId,
                }))
                build.onLoad({filter: /.*/, namespace: RUNTIME_MODULE_NAMESPACE}, args => {
                    if (args.path === reactModuleId) {
                        return {
                            contents: reactModuleSource,
                            loader: 'js',
                        }
                    }

                    if (args.path === reactDomModuleId) {
                        return {
                            contents: reactDomModuleSource,
                            loader: 'js',
                        }
                    }

                    throw new Error(`Unknown runtime module: ${args.path}`)
                })
            },
        },
    ],
    sourcemap: false,
    target: ['es2019'],
    tsconfig: path.join(root, 'tsconfig.json'),
})

await copyFile(extensionJs, distExtensionJs)
await copyFile(readme, distReadme)
