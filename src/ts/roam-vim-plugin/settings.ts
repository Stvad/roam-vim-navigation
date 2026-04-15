import {Dictionary} from 'lodash'

import {Shortcut} from 'src/core/features/vim-mode/types'

import {VIM_ENABLED_SETTING, VIM_PLUGIN_NAME} from './constants'

type MaybePromise<T> = T | Promise<T>
export type KeyboardLayout = 'qwerty' | 'colemak'

type InputChangeEvent = {
    target: {
        checked: boolean
        value: string
    }
}

type SelectChangeValue = string

type PanelSetting = {
    id: string
    name: string
    description?: string
    action: {
        content?: string
        default?: boolean | string
        items?: string[]
        onChange?: (event: InputChangeEvent | SelectChangeValue) => void | Promise<void>
        onClick?: () => void | Promise<void>
        placeholder?: string
        type: 'button' | 'input' | 'select' | 'switch'
    }
}

type PanelConfig = {
    settings: PanelSetting[]
    tabTitle: string
}

export interface RoamExtensionAPI {
    settings: {
        get: (key: string) => MaybePromise<unknown>
        panel: {
            create: (config: PanelConfig) => void
        }
        set: (key: string, value: unknown) => MaybePromise<void>
    }
}

export const VIM_KEYBOARD_LAYOUT_SETTING = 'keyboard-layout'

const DEFAULT_KEYBOARD_LAYOUT: KeyboardLayout = 'qwerty'

const layoutShortcutDefaults: Record<KeyboardLayout, Record<string, string>> = {
    qwerty: {
        'Select Block Up': 'k',
        'Select Block Down': 'j',
        'Select Panel Left': 'h',
    },
    colemak: {
        'Select Block Up': 'h',
        'Select Block Down': 'k',
        'Select Panel Left': 'j',
    },
}

const readSetting = async <T>(extensionAPI: RoamExtensionAPI, key: string) =>
    (await Promise.resolve(extensionAPI.settings.get(key))) as T | undefined

export const getKeyboardLayout = async (extensionAPI: RoamExtensionAPI) =>
    (await readSetting<KeyboardLayout>(extensionAPI, VIM_KEYBOARD_LAYOUT_SETTING)) ?? DEFAULT_KEYBOARD_LAYOUT

export const getDefaultShortcutValue = (shortcut: Shortcut, layout: KeyboardLayout = DEFAULT_KEYBOARD_LAYOUT) =>
    layoutShortcutDefaults[layout][shortcut.label] ?? shortcut.initValue

const isLayoutSensitiveShortcut = (shortcut: Shortcut) =>
    getDefaultShortcutValue(shortcut, 'qwerty') !== getDefaultShortcutValue(shortcut, 'colemak')

export const initializeSettings = async (extensionAPI: RoamExtensionAPI, shortcuts: Shortcut[]) => {
    if ((await readSetting<KeyboardLayout>(extensionAPI, VIM_KEYBOARD_LAYOUT_SETTING)) === undefined) {
        await extensionAPI.settings.set(VIM_KEYBOARD_LAYOUT_SETTING, DEFAULT_KEYBOARD_LAYOUT)
    }

    if ((await readSetting<boolean>(extensionAPI, VIM_ENABLED_SETTING)) === undefined) {
        await extensionAPI.settings.set(VIM_ENABLED_SETTING, false)
    }

    const layout = await getKeyboardLayout(extensionAPI)

    for (const shortcut of shortcuts) {
        if ((await readSetting<string>(extensionAPI, shortcut.id)) === undefined) {
            await extensionAPI.settings.set(shortcut.id, getDefaultShortcutValue(shortcut, layout))
        }
    }
}

export const resetShortcutSettings = async (
    extensionAPI: RoamExtensionAPI,
    shortcuts: Shortcut[],
    layout: KeyboardLayout
) => {
    for (const shortcut of shortcuts) {
        await extensionAPI.settings.set(shortcut.id, getDefaultShortcutValue(shortcut, layout))
    }
}

export const applyKeyboardLayoutPreset = async (
    extensionAPI: RoamExtensionAPI,
    shortcuts: Shortcut[],
    layout: KeyboardLayout
) => {
    for (const shortcut of shortcuts.filter(isLayoutSensitiveShortcut)) {
        await extensionAPI.settings.set(shortcut.id, getDefaultShortcutValue(shortcut, layout))
    }
}

export const isEnabled = async (extensionAPI: RoamExtensionAPI) =>
    (await readSetting<boolean>(extensionAPI, VIM_ENABLED_SETTING)) ?? false

export const getShortcutValue = async (extensionAPI: RoamExtensionAPI, shortcut: Shortcut) => {
    const value = await readSetting<string>(extensionAPI, shortcut.id)
    return typeof value === 'string' ? value : shortcut.initValue
}

export const getCurrentKeyMap = async (extensionAPI: RoamExtensionAPI, shortcuts: Shortcut[]) => {
    const entries = await Promise.all(
        shortcuts.map(async shortcut => [shortcut.id, await getShortcutValue(extensionAPI, shortcut)] as const)
    )

    return entries.reduce<Dictionary<string>>((acc, [id, value]) => {
        if (value) {
            acc[id] = value
        }
        return acc
    }, {})
}

export const getShortcutHandlers = (shortcuts: Shortcut[]) =>
    shortcuts.reduce<Dictionary<Shortcut['onPress']>>((acc, shortcut) => {
        acc[shortcut.id] = shortcut.onPress
        return acc
    }, {})

export const createSettingsPanel = (
    extensionAPI: RoamExtensionAPI,
    shortcuts: Shortcut[],
    onSettingsChange: () => Promise<void>
) => {
    const panelConfig: PanelConfig = {
        tabTitle: VIM_PLUGIN_NAME,
        settings: [
            {
                id: VIM_KEYBOARD_LAYOUT_SETTING,
                name: 'Keyboard Layout',
                description: 'Preset for layout-sensitive navigation bindings.',
                action: {
                    type: 'select',
                    items: ['qwerty', 'colemak'],
                    default: DEFAULT_KEYBOARD_LAYOUT,
                    onChange: async value => {
                        const layout = value as KeyboardLayout
                        await extensionAPI.settings.set(VIM_KEYBOARD_LAYOUT_SETTING, layout)
                        await applyKeyboardLayoutPreset(extensionAPI, shortcuts, layout)
                        await onSettingsChange()
                    },
                },
            },
            {
                id: VIM_ENABLED_SETTING,
                name: 'Enable Vim Mode',
                description: 'Turn the Vim navigation runtime on or off.',
                action: {
                    type: 'switch',
                    default: false,
                    onChange: async event => {
                        await extensionAPI.settings.set(VIM_ENABLED_SETTING, (event as InputChangeEvent).target.checked)
                        await onSettingsChange()
                    },
                },
            },
            {
                id: 'reset-shortcuts',
                name: 'Reset Shortcuts',
                description: 'Restore every keybinding to its default value.',
                action: {
                    type: 'button',
                    content: 'Reset to defaults',
                    onClick: async () => {
                        await resetShortcutSettings(extensionAPI, shortcuts, await getKeyboardLayout(extensionAPI))
                        await onSettingsChange()
                    },
                },
            },
            ...shortcuts.map<PanelSetting>(shortcut => ({
                id: shortcut.id,
                name: shortcut.label,
                description: `Default: ${shortcut.initValue}`,
                action: {
                    type: 'input',
                    placeholder: shortcut.initValue,
                    onChange: async event => {
                        await extensionAPI.settings.set(shortcut.id, (event as InputChangeEvent).target.value)
                        await onSettingsChange()
                    },
                },
            })),
        ],
    }

    extensionAPI.settings.panel.create(panelConfig)
}
