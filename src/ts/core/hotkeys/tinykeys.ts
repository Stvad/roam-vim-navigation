import {Dictionary} from 'lodash'

import {Handler, guardAgainstSimulatedKeys} from './simulation-guard'
import {KeySequence, KeySequenceString} from './key-sequence'

type KeyboardLayoutLike = {
    getLayoutMap?: () => Promise<Map<string, string> | {entries(): Iterable<[string, string]>}>
}

const MODIFIER_ALIASES: Record<string, string> = {
    alt: 'Alt',
    cmd: 'Meta',
    command: 'Meta',
    control: 'Control',
    ctrl: 'Control',
    meta: 'Meta',
    option: 'Alt',
    shift: 'Shift',
}

const KEY_ALIASES: Record<string, string> = {
    backspace: 'Backspace',
    del: 'Delete',
    delete: 'Delete',
    down: 'ArrowDown',
    end: 'End',
    enter: 'Enter',
    esc: 'Escape',
    escape: 'Escape',
    home: 'Home',
    left: 'ArrowLeft',
    pagedown: 'PageDown',
    pageup: 'PageUp',
    return: 'Enter',
    right: 'ArrowRight',
    space: 'Space',
    tab: 'Tab',
    up: 'ArrowUp',
}

const normalizeModifier = (modifier: string) => MODIFIER_ALIASES[modifier.toLowerCase()] ?? modifier

let layoutCodeByKey: Record<string, string> = {}

const getKeyboardLayout = (): KeyboardLayoutLike | undefined =>
    (navigator as Navigator & {keyboard?: KeyboardLayoutLike}).keyboard

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const keyPattern = (key: string) => {
    if (/^[a-z]$/i.test(key)) {
        return `[${key.toLowerCase()}${key.toUpperCase()}]`
    }

    return escapeRegex(key)
}

const getLayoutAwareKeyPattern = (key: string): string | null => {
    if (!/^[a-z0-9]$/i.test(key)) {
        return null
    }

    const layoutCode = layoutCodeByKey[key.toLowerCase()]
    if (!layoutCode) {
        return null
    }

    return `(${keyPattern(key)}|${escapeRegex(layoutCode)})`
}

const normalizeKey = (key: string) => {
    if (/^\(.+\)$/.test(key)) {
        return key
    }

    const lowerKey = key.toLowerCase()
    return KEY_ALIASES[lowerKey] ?? getLayoutAwareKeyPattern(key) ?? key
}

const toTinykeysPress = (press: string) => {
    const parts = press
        .split('+')
        .map(part => part.trim())
        .filter(Boolean)

    const key = normalizeKey(parts.pop() ?? '')
    const modifiers = parts.map(normalizeModifier)

    return [...modifiers, key].filter(Boolean).join('+')
}

export const toTinykeysKeySequence = (keySequenceString: KeySequenceString) =>
    keySequenceString
        .split(' ')
        .map(press => press.trim())
        .filter(Boolean)
        .map(toTinykeysPress)
        .join(' ')

export const syncKeyboardLayoutMap = async () => {
    const keyboard = getKeyboardLayout()
    if (!keyboard?.getLayoutMap) {
        layoutCodeByKey = {}
        return
    }

    const layoutMap = await keyboard.getLayoutMap()
    layoutCodeByKey = Array.from(layoutMap.entries()).reduce<Record<string, string>>((acc, [code, value]) => {
        if (/^[a-z0-9]$/i.test(value) && !acc[value.toLowerCase()]) {
            acc[value.toLowerCase()] = code
        }
        return acc
    }, {})
}

export const resetKeyboardLayoutMap = () => {
    layoutCodeByKey = {}
}

export const createTinykeysKeyMap = (
    keyMap: Dictionary<KeySequenceString>,
    handlers: Dictionary<Handler>,
): Dictionary<Handler> =>
    Object.keys(keyMap).reduce<Dictionary<Handler>>((tinykeysKeyMap, id) => {
        const keySequenceString = keyMap[id]
        const handler = handlers[id]

        if (!keySequenceString || !handler) {
            return tinykeysKeyMap
        }

        tinykeysKeyMap[toTinykeysKeySequence(keySequenceString)] = guardAgainstSimulatedKeys(
            KeySequence.fromString(keySequenceString),
            handler,
        )
        return tinykeysKeyMap
    }, {})
