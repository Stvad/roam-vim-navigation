import {registerHotkeys} from 'src/core/hotkeys'
import {getPrimaryHintShortcut, startVimMode, stopVimMode, VIM_SHORTCUTS} from './feature'
import {
    createSettingsPanel,
    getCurrentKeyMap,
    getKeyboardLayout,
    getShortcutHandlers,
    getShortcutValue,
    initializeSettings,
    RoamExtensionAPI,
} from './settings'
import {isVimModeOn} from 'src/core/features/vim-mode/vim-init'
import {DEFAULT_HINT_KEYS, resetHintKeyProvider, setHintKeyProvider} from 'src/core/features/vim-mode/hint-view'
import {
    PAGE_HINT_ALPHABETS,
    PAGE_HINT_HOME_ROW_ALPHABETS,
    resetPageHintAlphabet,
    setPageHintAlphabet,
    stopPageHintSession,
} from 'src/core/features/vim-mode/page-hint-view'
import {removeStyle} from 'src/core/common/css'

let extensionAPI: RoamExtensionAPI | null = null
let unregisterHotkeys = () => {}
let unregisterLayoutChangeListener = () => {}

type KeyboardWithOptionalLayoutChangeSupport = Navigator['keyboard'] & {
    addEventListener?: (
        type: 'layoutchange',
        listener: (this: Keyboard, ev: Event) => any,
        options?: boolean | AddEventListenerOptions,
    ) => void
    removeEventListener?: (
        type: 'layoutchange',
        listener: (this: Keyboard, ev: Event) => any,
        options?: boolean | EventListenerOptions,
    ) => void
    onlayoutchange?: ((this: Keyboard, ev: Event) => any) | null
}

export const subscribeToKeyboardLayoutChanges = (onLayoutChange: () => void) => {
    const keyboard = navigator.keyboard as KeyboardWithOptionalLayoutChangeSupport | undefined
    if (!keyboard) {
        return () => {}
    }

    const listener = () => {
        void onLayoutChange()
    }

    if (typeof keyboard.addEventListener === 'function' && typeof keyboard.removeEventListener === 'function') {
        keyboard.addEventListener('layoutchange', listener)
        return () => keyboard.removeEventListener?.('layoutchange', listener)
    }

    if ('onlayoutchange' in keyboard) {
        const previousOnLayoutChange = keyboard.onlayoutchange
        keyboard.onlayoutchange = function (this: Keyboard, event: Event) {
            previousOnLayoutChange?.call(this, event)
            listener()
        }
        return () => {
            keyboard.onlayoutchange = previousOnLayoutChange ?? null
        }
    }

    return () => {}
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

    const keyboardLayout = await getKeyboardLayout(api)
    setPageHintAlphabet(PAGE_HINT_ALPHABETS[keyboardLayout], PAGE_HINT_HOME_ROW_ALPHABETS[keyboardLayout])
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
    unregisterLayoutChangeListener = subscribeToKeyboardLayoutChanges(renderHotkeys)

    await syncPluginState()
}

const onunload = async () => {
    if (isVimModeOn()) {
        stopVimMode()
    }

    unregisterHotkeys()
    unregisterHotkeys = () => {}
    unregisterLayoutChangeListener()
    unregisterLayoutChangeListener = () => {}
    await resetHintKeyProvider()
    resetPageHintAlphabet()
    stopPageHintSession()
    removeStyle('roam-toolkit-block-mode')
    removeStyle('roam-toolkit-block-mode--hint')
    removeStyle('roam-toolkit-block-mode--page-hint')
    extensionAPI = null
}

const plugin = {
    onload,
    onunload,
}

export default plugin
