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

export default React

export const Children = React.Children
export const Component = React.Component
export const Fragment = React.Fragment
export const PureComponent = React.PureComponent
export const StrictMode = React.StrictMode
export const Suspense = React.Suspense
export const cloneElement = React.cloneElement
export const createContext = React.createContext
export const createElement = React.createElement
export const createFactory = React.createFactory
export const createRef = React.createRef
export const forwardRef = React.forwardRef
export const isValidElement = React.isValidElement
export const lazy = React.lazy
export const memo = React.memo
export const useCallback = React.useCallback
export const useContext = React.useContext
export const useDebugValue = React.useDebugValue
export const useEffect = React.useEffect
export const useImperativeHandle = React.useImperativeHandle
export const useLayoutEffect = React.useLayoutEffect
export const useMemo = React.useMemo
export const useReducer = React.useReducer
export const useRef = React.useRef
export const useState = React.useState
export const version = React.version
`

const reactDomModuleSource = `
const ReactDOM = window.ReactDOM

if (!ReactDOM) {
    throw new Error('Roam runtime did not provide window.ReactDOM')
}

export default ReactDOM

export const createPortal = ReactDOM.createPortal
export const findDOMNode = ReactDOM.findDOMNode
export const hydrate = ReactDOM.hydrate
export const render = ReactDOM.render
export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode
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
