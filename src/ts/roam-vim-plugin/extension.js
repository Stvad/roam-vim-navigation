import './roam-vim-plugin.js'

const plugin = window.RoamToolkitVimPlugin

if (!plugin) {
    throw new Error('RoamToolkitVimPlugin was not initialized. Run `npm run build:vim-plugin` first.')
}

export default plugin
