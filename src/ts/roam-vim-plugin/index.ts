import {registerHotkeys} from 'src/core/hotkeys'
import {getPrimaryHintShortcut, startVimMode, stopVimMode, VIM_SHORTCUTS} from './feature'
import {
    createSettingsPanel,
    getCurrentKeyMap,
    getShortcutHandlers,
    getShortcutValue,
    initializeSettings,
    RoamExtensionAPI,
} from './settings'
import {isVimModeOn} from 'src/core/features/vim-mode/vim-init'
import {DEFAULT_HINT_KEYS, resetHintKeyProvider, setHintKeyProvider} from 'src/core/features/vim-mode/hint-view'
import {removeStyle} from 'src/core/common/css'

let extensionAPI: RoamExtensionAPI | null = null
let unregisterHotkeys = () => {}

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

    const keyMap = await getCurrentKeyMap(extensionAPI, VIM_SHORTCUTS)
    const handlers = getShortcutHandlers(VIM_SHORTCUTS)

    unregisterHotkeys()
    unregisterHotkeys = await registerHotkeys({keyMap, handlers})
}

const syncPluginState = async () => {
    if (!extensionAPI) {
        return
    }

    await syncHintKeys()
    await renderHotkeys()
    if (!isVimModeOn()) {
        await startVimMode()
    }
}

type OnloadArgs = {
    extensionAPI: RoamExtensionAPI
}

const onload = async ({extensionAPI: api}: OnloadArgs) => {
    extensionAPI = api
    await initializeSettings(api, VIM_SHORTCUTS)
    createSettingsPanel(api, VIM_SHORTCUTS, syncPluginState)
    await syncPluginState()
}

const onunload = async () => {
    if (isVimModeOn()) {
        stopVimMode()
    }

    unregisterHotkeys()
    unregisterHotkeys = () => {}
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
