import {
    createShortcutHelpEntries,
    resetHelpPanel,
    setShortcutHelpEntries,
    toggleHelpPanel,
} from 'src/core/features/vim-mode/help-panel'
import {Shortcut} from 'src/core/features/vim-mode/types'

const shortcuts: Shortcut[] = [
    {
        type: 'shortcut',
        id: 'toggle-help-panel',
        label: 'Toggle Help Panel',
        initValue: 'shift+/',
        modes: ['normal', 'visual', 'hint'],
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
        id: 'move-block-up',
        label: 'Move Block Up',
        initValue: 'command+shift+h',
        modes: ['normal', 'insert'],
        onPress: jest.fn(),
    },
]

describe('Vim help panel', () => {
    afterEach(() => {
        resetHelpPanel()
        document.body.innerHTML = ''
    })

    it('creates help entries from registered shortcuts and current key bindings', () => {
        expect(createShortcutHelpEntries(shortcuts, {'select-block-down': 'down'})).toEqual([
            {
                id: 'toggle-help-panel',
                key: 'shift+/',
                label: 'Toggle Help Panel',
                modes: ['normal', 'visual', 'hint'],
            },
            {
                id: 'select-block-down',
                key: 'down',
                label: 'Select Block Down',
                modes: ['normal', 'visual'],
            },
            {
                id: 'move-block-up',
                key: 'command+shift+h',
                label: 'Move Block Up',
                modes: ['normal', 'insert'],
            },
        ])
    })

    it('renders the help panel from shortcut entries and formats the question mark binding', () => {
        setShortcutHelpEntries(createShortcutHelpEntries(shortcuts, {'select-block-down': 'down'}))

        toggleHelpPanel()

        const dialog = document.querySelector('[role="dialog"]') as HTMLElement
        expect(dialog).not.toBeNull()
        expect(dialog.textContent).toContain('Roam Vim Help')
        expect(dialog.textContent).toContain('Normal + Visual + Hint Modes')
        expect(dialog.textContent).toContain('Toggle Help Panel')
        expect(dialog.textContent).toContain('Normal + Visual Modes')
        expect(dialog.textContent).toContain('Select Block Down')
        expect(dialog.textContent).toContain('Normal + Insert Modes')
        expect(dialog.textContent).toContain('Move Block Up')
        expect(Array.from(dialog.querySelectorAll('kbd')).map(element => element.textContent)).toContain('?')
        expect(Array.from(dialog.querySelectorAll('kbd')).map(element => element.textContent)).toContain('Down')
    })

    it('closes when toggled again or when Escape is pressed', () => {
        setShortcutHelpEntries(createShortcutHelpEntries(shortcuts, {}))

        toggleHelpPanel()
        expect(document.querySelector('[role="dialog"]')).not.toBeNull()

        toggleHelpPanel()
        expect(document.querySelector('[role="dialog"]')).toBeNull()

        toggleHelpPanel()
        document.dispatchEvent(
            new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'Escape',
            }),
        )

        expect(document.querySelector('[role="dialog"]')).toBeNull()
    })
})
