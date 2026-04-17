import {matchKeyBindingPress, parseKeybinding} from 'tinykeys'

import {KeySequence, KeySequenceString} from 'src/core/hotkeys/key-sequence'
import {guardAgainstSimulatedKeys, Handler} from 'src/core/hotkeys/simulation-guard'
import {delay} from 'src/core/common/async'
import {createTinykeysKeyMap, toTinykeysKeySequence} from 'src/core/hotkeys/tinykeys'

describe('Converting key sequences for tinykeys', () => {
    it('maps existing modifier aliases to tinykeys modifier names', () => {
        expect(toTinykeysKeySequence('Shift+cmd+H')).toEqual('Shift+Meta+KeyH')
    })

    it('maps character keys to physical key codes so modifier variants still match', () => {
        expect(toTinykeysKeySequence('alt+z')).toEqual('Alt+KeyZ')
        expect(toTinykeysKeySequence('ctrl+shift+2')).toEqual('Control+Shift+Digit2')
        expect(toTinykeysKeySequence('g g')).toEqual('KeyG KeyG')
    })

    it('maps special keys to browser key names tinykeys recognizes', () => {
        expect(toTinykeysKeySequence('ctrl+alt+up')).toEqual('Control+Alt+ArrowUp')
        expect(toTinykeysKeySequence('cmd+enter')).toEqual('Meta+Enter')
    })
})

describe('tinykeys matching behavior', () => {
    it('matches command+shift+h without matching command+h', () => {
        const [keyBindingPress] = parseKeybinding('Meta+Shift+KeyH')
        const commandShiftHEvent = {
            code: 'KeyH',
            key: 'H',
            getModifierState: (modifier: string) => modifier === 'Meta' || modifier === 'Shift',
        } as unknown as KeyboardEvent
        const commandHEvent = {
            code: 'KeyH',
            key: 'h',
            getModifierState: (modifier: string) => modifier === 'Meta',
        } as unknown as KeyboardEvent

        expect(matchKeyBindingPress(commandShiftHEvent, keyBindingPress)).toBe(true)
        expect(matchKeyBindingPress(commandHEvent, keyBindingPress)).toBe(false)
    })

    it('matches alt+z on macOS using the physical key code when option changes the character', () => {
        const [keyBindingPress] = parseKeybinding('Alt+KeyZ')
        const optionZEvent = {
            code: 'KeyZ',
            key: 'Ω',
            getModifierState: (modifier: string) => modifier === 'Alt',
        } as unknown as KeyboardEvent

        expect(matchKeyBindingPress(optionZEvent, keyBindingPress)).toBe(true)
    })

    it('matches ctrl+shift+2 using the physical digit key code', () => {
        const [keyBindingPress] = parseKeybinding('Control+Shift+Digit2')
        const hardRescheduleEvent = {
            code: 'Digit2',
            key: '@',
            getModifierState: (modifier: string) => modifier === 'Control' || modifier === 'Shift',
        } as unknown as KeyboardEvent

        expect(matchKeyBindingPress(hardRescheduleEvent, keyBindingPress)).toBe(true)
    })
})

describe('Creating a tinykeys key map', () => {
    it('adapts existing keybindings to tinykeys format', () => {
        const moveBlockUp = jest.fn()
        const keyMap = createTinykeysKeyMap({MOVE_BLOCK_UP: 'command+shift+h'}, {MOVE_BLOCK_UP: moveBlockUp})

        expect(Object.keys(keyMap)).toEqual(['Meta+Shift+KeyH'])
        expect(keyMap['Meta+Shift+KeyH']).toBeDefined()
    })
})

describe('Not recursively triggering our own hotkeys when simulating keys for native actions', () => {
    const adaptHandler = (keySequenceString: KeySequenceString, handler: Handler): Handler =>
        guardAgainstSimulatedKeys(KeySequence.fromString(keySequenceString), handler)

    it('lets handlers trigger when no other handler is running', () => {
        const ourCustomEscapeHotkey = jest.fn()
        const escapeHandler = adaptHandler('Escape', ourCustomEscapeHotkey)

        escapeHandler({} as KeyboardEvent)

        expect(ourCustomEscapeHotkey).toHaveBeenCalled()
    })

    it("should not trigger our own Escape hotkey when simulating 'Escape' from a different hotkey", async () => {
        const ourCustomEscapeHotkey = jest.fn()
        const escapeHandler = adaptHandler('Escape', ourCustomEscapeHotkey)
        const anotherHandler = adaptHandler('D', async () => {
            await delay(1)
            // Pretend that our handler simulates "Escape"
            escapeHandler({} as KeyboardEvent)
        })

        await anotherHandler({} as KeyboardEvent)

        expect(ourCustomEscapeHotkey).not.toHaveBeenCalled()
    })

    it("allows keys that aren't simulated to run while other hotkeys are running", async () => {
        const ourCustomHotkey = jest.fn()
        const handler = adaptHandler('J', async () => {
            await delay(1)
            // Pretend that our handler simulates "Escape"
            ourCustomHotkey({} as KeyboardEvent)
        })

        // Don't block hotkeys from executing by default, so repeated keys feel responsive
        handler({} as KeyboardEvent)
        await handler({} as KeyboardEvent)

        expect(ourCustomHotkey).toHaveBeenCalledTimes(2)
    })
})
