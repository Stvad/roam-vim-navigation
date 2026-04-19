import {Shortcut} from 'src/core/features/vim-mode/types'
import {
    applyKeyboardLayoutPreset,
    createSettingsPanel,
    getDefaultShortcutValue,
    initializeSettings,
    RoamExtensionAPI,
    VIM_KEYBOARD_LAYOUT_SETTING,
} from 'src/roam-vim-plugin/settings'

const shortcuts: Shortcut[] = [
    {
        type: 'shortcut',
        id: 'select-block-up',
        label: 'Select Block Up',
        initValue: 'k',
        modes: ['normal', 'visual'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'select-block-down',
        label: 'Select Block Down',
        initValue: 'j',
        modes: ['normal', 'visual'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'select-panel-left',
        label: 'Select Panel Left',
        initValue: 'h',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'open-mentions',
        label: 'Open mentions',
        initValue: '2',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'move-block-up',
        label: 'Move Block Up',
        initValue: 'command+shift+k',
        modes: ['normal', 'insert'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'move-block-down',
        label: 'Move Block Down',
        initValue: 'command+shift+j',
        modes: ['normal', 'insert'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'increment-date-layout-up',
        label: 'Increment Date (Layout Up Key)',
        initValue: 'ctrl+alt+k',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'decrement-date-layout-down',
        label: 'Decrement Date (Layout Down Key)',
        initValue: 'ctrl+alt+j',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'increment-date-week-layout-up',
        label: 'Increment Date by a week (Layout Up Key)',
        initValue: 'ctrl+shift+k',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'decrement-date-week-layout-down',
        label: 'Decrement Date by a week (Layout Down Key)',
        initValue: 'ctrl+shift+j',
        modes: ['normal'],
        onPress: jest.fn(),
    },
    {
        type: 'shortcut',
        id: 'exit-to-normal-mode',
        label: 'Exit to Normal Mode',
        initValue: 'Escape',
        modes: ['normal', 'visual', 'insert'],
        onPress: jest.fn(),
    },
]

const getShortcut = (label: string) => {
    const shortcut = shortcuts.find(it => it.label === label)
    if (!shortcut) {
        throw new Error(`Missing shortcut: ${label}`)
    }
    return shortcut
}

const createExtensionApi = (initialState: Record<string, unknown> = {}) => {
    const state = {...initialState}

    const extensionAPI: RoamExtensionAPI = {
        settings: {
            get: (key: string) => state[key],
            panel: {
                create: jest.fn(),
            },
            set: async (key: string, value: unknown) => {
                state[key] = value
            },
        },
    }

    return {extensionAPI, state}
}

describe('Roam Vim plugin keyboard layout settings', () => {
    it('initializes qwerty navigation defaults', async () => {
        const {extensionAPI, state} = createExtensionApi()
        const selectBlockUp = getShortcut('Select Block Up')
        const selectBlockDown = getShortcut('Select Block Down')
        const selectPanelLeft = getShortcut('Select Panel Left')
        const moveBlockUp = getShortcut('Move Block Up')
        const moveBlockDown = getShortcut('Move Block Down')
        const incrementDateLayoutUp = getShortcut('Increment Date (Layout Up Key)')
        const decrementDateLayoutDown = getShortcut('Decrement Date (Layout Down Key)')
        const incrementWeekLayoutUp = getShortcut('Increment Date by a week (Layout Up Key)')
        const decrementWeekLayoutDown = getShortcut('Decrement Date by a week (Layout Down Key)')

        await initializeSettings(extensionAPI, shortcuts)

        expect(state[VIM_KEYBOARD_LAYOUT_SETTING]).toEqual('qwerty')
        expect(state.enabled).toBeUndefined()
        expect(state[selectBlockUp.id]).toEqual('k')
        expect(state[selectBlockDown.id]).toEqual('j')
        expect(state[selectPanelLeft.id]).toEqual('h')
        expect(state[moveBlockUp.id]).toEqual('command+shift+k')
        expect(state[moveBlockDown.id]).toEqual('command+shift+j')
        expect(state[incrementDateLayoutUp.id]).toEqual('ctrl+alt+k')
        expect(state[decrementDateLayoutDown.id]).toEqual('ctrl+alt+j')
        expect(state[incrementWeekLayoutUp.id]).toEqual('ctrl+shift+k')
        expect(state[decrementWeekLayoutDown.id]).toEqual('ctrl+shift+j')
    })

    it('applies the colemak preset only to layout-sensitive shortcuts', async () => {
        const openMentions = getShortcut('Open mentions')
        const {extensionAPI, state} = createExtensionApi({
            [openMentions.id]: '9',
        })
        const selectBlockUp = getShortcut('Select Block Up')
        const selectBlockDown = getShortcut('Select Block Down')
        const selectPanelLeft = getShortcut('Select Panel Left')
        const moveBlockUp = getShortcut('Move Block Up')
        const moveBlockDown = getShortcut('Move Block Down')
        const incrementDateLayoutUp = getShortcut('Increment Date (Layout Up Key)')
        const decrementDateLayoutDown = getShortcut('Decrement Date (Layout Down Key)')
        const incrementWeekLayoutUp = getShortcut('Increment Date by a week (Layout Up Key)')
        const decrementWeekLayoutDown = getShortcut('Decrement Date by a week (Layout Down Key)')

        await initializeSettings(extensionAPI, shortcuts)
        await applyKeyboardLayoutPreset(extensionAPI, shortcuts, 'colemak')

        expect(getDefaultShortcutValue(selectBlockUp, 'colemak')).toEqual('h')
        expect(state[selectBlockUp.id]).toEqual('h')
        expect(state[selectBlockDown.id]).toEqual('k')
        expect(state[selectPanelLeft.id]).toEqual('j')
        expect(state[moveBlockUp.id]).toEqual('command+shift+h')
        expect(state[moveBlockDown.id]).toEqual('command+shift+k')
        expect(state[incrementDateLayoutUp.id]).toEqual('ctrl+alt+h')
        expect(state[decrementDateLayoutDown.id]).toEqual('ctrl+alt+k')
        expect(state[incrementWeekLayoutUp.id]).toEqual('ctrl+shift+h')
        expect(state[decrementWeekLayoutDown.id]).toEqual('ctrl+shift+k')
        expect(state[openMentions.id]).toEqual('9')
    })

    it('groups shortcut settings by mode and omits the runtime toggle', () => {
        const {extensionAPI} = createExtensionApi()

        createSettingsPanel(extensionAPI, shortcuts, jest.fn().mockResolvedValue(undefined))

        const createPanel = extensionAPI.settings.panel.create as jest.Mock
        const panelConfig = createPanel.mock.calls[0][0]

        expect(createPanel).toHaveBeenCalledTimes(1)
        expect(panelConfig.settings.map((setting: {id: string}) => setting.id)).toEqual([
            VIM_KEYBOARD_LAYOUT_SETTING,
            'reset-shortcuts',
            'section-normal',
            'select-panel-left',
            'open-mentions',
            'increment-date-layout-up',
            'decrement-date-layout-down',
            'increment-date-week-layout-up',
            'decrement-date-week-layout-down',
            'section-normal-visual',
            'select-block-up',
            'select-block-down',
            'section-normal-insert',
            'move-block-up',
            'move-block-down',
            'section-normal-visual-insert',
            'exit-to-normal-mode',
        ])
        expect(panelConfig.settings.map((setting: {name: string}) => setting.name).filter(Boolean)).not.toContain(
            'Enable Vim Mode',
        )
        expect(
            panelConfig.settings
                .filter((setting: {action: {type: string}}) => setting.action.type === 'reactComponent')
                .map((setting: {id: string}) => setting.id),
        ).toEqual(['section-normal', 'section-normal-visual', 'section-normal-insert', 'section-normal-visual-insert'])
    })
})
