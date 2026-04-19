import {Dictionary} from 'lodash'

import {Handler, guardAgainstSimulatedKeys} from './simulation-guard'
import {KeySequence, KeySequenceString} from './key-sequence'

type KeyboardLayoutMapLike = {
    entries(): IterableIterator<[string, string]>
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
const isAltModifier = (modifier: string) => normalizeModifier(modifier) === 'Alt'
const isLetterKey = (key: string) => /^[a-z]$/i.test(key)

const getCodeKeysForLogicalLetter = (key: string, layoutMap?: KeyboardLayoutMapLike) => {
    if (!layoutMap || !isLetterKey(key)) {
        return []
    }

    const logicalKey = key.toLowerCase()
    const matchingCodes = Array.from(layoutMap.entries())
        .filter(([, mappedKey]) => mappedKey.toLowerCase() === logicalKey)
        .map(([code]) => code)

    return [...new Set(matchingCodes)]
}

const normalizeKey = (key: string, modifiers: string[] = [], layoutMap?: KeyboardLayoutMapLike) => {
    if (/^\(.+\)$/.test(key)) {
        return key
    }

    const lowerKey = key.toLowerCase()
    const normalizedModifiers = modifiers.map(normalizeModifier)

    if (normalizedModifiers.some(isAltModifier) && isLetterKey(lowerKey)) {
        const matchingCodes = getCodeKeysForLogicalLetter(lowerKey, layoutMap)
        if (matchingCodes.length === 1) {
            return matchingCodes[0]
        }
        if (matchingCodes.length > 1) {
            return `(${matchingCodes.join('|')})`
        }
    }

    if (/^\d$/.test(lowerKey)) {
        return `(Digit${lowerKey})`
    }

    return KEY_ALIASES[lowerKey] ?? key
}

const toTinykeysPress = (press: string, layoutMap?: KeyboardLayoutMapLike) => {
    const parts = press
        .split('+')
        .map(part => part.trim())
        .filter(Boolean)

    const key = normalizeKey(parts.pop() ?? '', parts, layoutMap)
    const modifiers = parts.map(normalizeModifier)

    return [...modifiers, key].filter(Boolean).join('+')
}

export const toTinykeysKeySequence = (keySequenceString: KeySequenceString, layoutMap?: KeyboardLayoutMapLike) =>
    keySequenceString
        .split(' ')
        .map(press => press.trim())
        .filter(Boolean)
        .map(press => toTinykeysPress(press, layoutMap))
        .join(' ')

const getKeyboardLayoutMap = async (): Promise<KeyboardLayoutMapLike | undefined> => {
    try {
        return await navigator.keyboard?.getLayoutMap()
    } catch (error) {
        console.warn('Unable to resolve keyboard layout map for hotkeys', error)
        return undefined
    }
}

export const createTinykeysKeyMap = (
    layoutMap: KeyboardLayoutMapLike | undefined,
    keyMap: Dictionary<KeySequenceString>,
    handlers: Dictionary<Handler>,
): Dictionary<Handler> =>
    Object.keys(keyMap).reduce<Dictionary<Handler>>((tinykeysKeyMap, id) => {
        const keySequenceString = keyMap[id]
        const handler = handlers[id]

        if (!keySequenceString || !handler) {
            return tinykeysKeyMap
        }

        tinykeysKeyMap[toTinykeysKeySequence(keySequenceString, layoutMap)] = guardAgainstSimulatedKeys(
            KeySequence.fromString(keySequenceString),
            handler,
        )
        return tinykeysKeyMap
    }, {})

export const createTinykeysKeyMapForCurrentLayout = async (
    keyMap: Dictionary<KeySequenceString>,
    handlers: Dictionary<Handler>,
) => createTinykeysKeyMap(await getKeyboardLayoutMap(), keyMap, handlers)
