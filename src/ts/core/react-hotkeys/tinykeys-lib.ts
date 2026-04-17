type TinykeysKeyBindingPress = [string[], string | RegExp]

type TinykeysKeyBindingMap = {
    [keybinding: string]: (event: KeyboardEvent) => void
}

type TinykeysModule = {
    createKeybindingsHandler: (
        keyBindingMap: TinykeysKeyBindingMap,
        options?: {timeout?: number}
    ) => (event: KeyboardEvent) => void
    matchKeyBindingPress: (event: KeyboardEvent, press: TinykeysKeyBindingPress) => boolean
    parseKeybinding: (str: string) => TinykeysKeyBindingPress[]
    tinykeys: (
        target: Window | HTMLElement,
        keyBindingMap: TinykeysKeyBindingMap,
        options?: {capture?: boolean; event?: 'keydown' | 'keyup'; timeout?: number}
    ) => () => void
}

declare const require: (moduleName: string) => unknown

// Use the runtime entry directly so the tinykeys TS 4.x declarations don't block our TS 3.9 build.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tinykeysModule = require('tinykeys') as TinykeysModule

export const createKeybindingsHandler = tinykeysModule.createKeybindingsHandler
export const matchKeyBindingPress = tinykeysModule.matchKeyBindingPress
export const parseKeybinding = tinykeysModule.parseKeybinding
export const tinykeys = tinykeysModule.tinykeys
