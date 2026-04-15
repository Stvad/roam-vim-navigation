import React from 'react'
import ReactDOM from 'react-dom'

import {ReactHotkeys} from 'src/core/react-hotkeys'
import {getPrimaryHintShortcut, startVimMode, stopVimMode, VIM_SHORTCUTS} from './feature'
import {
    createSettingsPanel,
    getCurrentKeyMap,
    getShortcutHandlers,
    getShortcutValue,
    initializeSettings,
    isEnabled,
    RoamExtensionAPI,
} from './settings'
import {isVimModeOn} from 'src/core/features/vim-mode/vim-init'
import {DEFAULT_HINT_KEYS, resetHintKeyProvider, setHintKeyProvider} from 'src/core/features/vim-mode/hint-view'
import {removeStyle} from 'src/core/common/css'

let extensionAPI: RoamExtensionAPI | null = null

const shortcutContainer = document.createElement('div')
shortcutContainer.id = 'roam-toolkit-vim-mode-hotkeys'
shortcutContainer.style.display = 'none'

const ensureShortcutContainer = () => {
    if (!shortcutContainer.isConnected) {
        document.body.appendChild(shortcutContainer)
    }
}

const unmountHotkeys = () => {
    ReactDOM.unmountComponentAtNode(shortcutContainer)
}

const syncHintKeys = async () => {
    if (!extensionAPI) {
        return
    }

    const api = extensionAPI

    await setHintKeyProvider(async hintId => {
        const shortcut = getPrimaryHintShortcut(hintId)
        if (!shortcut) {
            return DEFAULT_HINT_KEYS[hintId]
        }

        return getShortcutValue(api, shortcut)
    })
}

const renderHotkeys = async () => {
    if (!extensionAPI) {
        return
    }

    ensureShortcutContainer()
    const keyMap = await getCurrentKeyMap(extensionAPI, VIM_SHORTCUTS)
    const handlers = getShortcutHandlers(VIM_SHORTCUTS)

    ReactDOM.render(<ReactHotkeys keyMap={keyMap} handlers={handlers} />, shortcutContainer)
}

const syncPluginState = async () => {
    if (!extensionAPI) {
        return
    }

    await syncHintKeys()

    if (await isEnabled(extensionAPI)) {
        await renderHotkeys()
        if (!isVimModeOn()) {
            await startVimMode()
        }
        return
    }

    if (isVimModeOn()) {
        stopVimMode()
    }
    unmountHotkeys()
}

type OnloadArgs = {
    extensionAPI: RoamExtensionAPI
}

const onload = async ({extensionAPI: api}: OnloadArgs) => {
    extensionAPI = api
    ensureShortcutContainer()
    await initializeSettings(api, VIM_SHORTCUTS)
    createSettingsPanel(api, VIM_SHORTCUTS, syncPluginState)
    await syncPluginState()
}

const onunload = async () => {
    if (isVimModeOn()) {
        stopVimMode()
    }

    unmountHotkeys()
    shortcutContainer.remove()
    await resetHintKeyProvider()
    removeStyle('roam-toolkit-block-mode')
    removeStyle('roam-toolkit-block-mode--hint')
    extensionAPI = null
}

const plugin = {
    onload,
    onunload,
}

export default plugin
