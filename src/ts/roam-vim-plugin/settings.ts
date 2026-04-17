import {Dictionary} from 'lodash'

import {Shortcut} from 'src/core/features/vim-mode/types'

import {VIM_PLUGIN_NAME} from './constants'

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
        component?: () => unknown
        content?: string
        default?: boolean | string
        items?: string[]
        onChange?: (event: InputChangeEvent | SelectChangeValue) => void | Promise<void>
        onClick?: () => void | Promise<void>
        placeholder?: string
        type: 'button' | 'input' | 'reactComponent' | 'select' | 'switch'
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
const MODE_ORDER = ['normal', 'visual', 'insert'] as const
const MODE_GROUP_ORDER = ['normal', 'normal+visual', 'normal+insert', 'normal+visual+insert']
const MODE_LABELS: Record<typeof MODE_ORDER[number], string> = {
    normal: 'Normal',
    visual: 'Visual',
    insert: 'Insert',
}

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

export const getShortcutValue = async (extensionAPI: RoamExtensionAPI, shortcut: Shortcut) => {
    const value = await readSetting<string>(extensionAPI, shortcut.id)
    return typeof value === 'string' ? value : getDefaultShortcutValue(shortcut, await getKeyboardLayout(extensionAPI))
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

const modeSortIndex = (mode: string) => {
    const index = MODE_ORDER.indexOf(mode as typeof MODE_ORDER[number])
    return index === -1 ? MODE_ORDER.length : index
}

const normalizeModeGroup = (shortcut: Shortcut) =>
    [...new Set(shortcut.modes)].sort((left, right) => modeSortIndex(left) - modeSortIndex(right)).join('+')

const getModeGroupLabel = (group: string) => {
    if (group === MODE_GROUP_ORDER[MODE_GROUP_ORDER.length - 1]) {
        return 'All Modes'
    }

    const labels = group
        .split('+')
        .map(mode => MODE_LABELS[mode as keyof typeof MODE_LABELS] ?? mode)
        .join(' + ')

    return `${labels} ${group.includes('+') ? 'Modes' : 'Mode'}`
}

const createSectionHeader = (id: string, label: string): PanelSetting => ({
    id,
    name: label,
    action: {
        type: 'reactComponent',
        component: () => '',
    },
})

const getShortcutSettings = (
    extensionAPI: RoamExtensionAPI,
    shortcuts: Shortcut[],
    onSettingsChange: () => Promise<void>
): PanelSetting[] => {
    const groupedShortcuts = shortcuts.reduce<Record<string, Shortcut[]>>((acc, shortcut) => {
        const group = normalizeModeGroup(shortcut)
        if (!acc[group]) {
            acc[group] = []
        }
        acc[group].push(shortcut)
        return acc
    }, {})

    const orderedGroups = [
        ...MODE_GROUP_ORDER,
        ...Object.keys(groupedShortcuts)
            .filter(group => !MODE_GROUP_ORDER.includes(group))
            .sort(),
    ]

    return orderedGroups.flatMap(group => {
        const sectionShortcuts = groupedShortcuts[group]
        if (!sectionShortcuts?.length) {
            return []
        }

        return [
            createSectionHeader(`section-${group.replace(/\+/g, '-')}`, getModeGroupLabel(group)),
            ...sectionShortcuts.map<PanelSetting>(shortcut => ({
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
        ]
    })
}

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
            ...getShortcutSettings(extensionAPI, shortcuts, onSettingsChange),
        ],
    }

    extensionAPI.settings.panel.create(panelConfig)
}
