import {Dictionary} from 'lodash'

import {Handler} from './key-handler'
import {KeySequenceString} from './key-sequence'

const MODIFIER_ORDER = ['command', 'ctrl', 'alt', 'shift'] as const
const MODIFIER_ALIASES: Record<string, typeof MODIFIER_ORDER[number]> = {
    cmd: 'command',
    command: 'command',
    control: 'ctrl',
    ctrl: 'ctrl',
    meta: 'command',
    option: 'alt',
    alt: 'alt',
    shift: 'shift',
}

const KEY_ALIASES: Record<string, string> = {
    down: 'arrowdown',
    del: 'delete',
    esc: 'escape',
    left: 'arrowleft',
    return: 'enter',
    right: 'arrowright',
    spacebar: 'space',
    space: 'space',
    up: 'arrowup',
}

const normalizeModifier = (modifier: string) => MODIFIER_ALIASES[modifier.toLowerCase()]

const normalizeKey = (key: string) => {
    const lowerKey = key.trim().toLowerCase()

    if (!lowerKey) {
        return ''
    }

    if (lowerKey === ' ') {
        return 'space'
    }

    return KEY_ALIASES[lowerKey] ?? lowerKey
}

const normalizeKeyChord = (keyChordString: string) => {
    const parts = keyChordString
        .split('+')
        .map(part => part.trim())
        .filter(Boolean)

    const key = normalizeKey(parts.pop() ?? '')
    const modifiers = Array.from(
        new Set(
            parts.map(normalizeModifier).filter((modifier): modifier is typeof MODIFIER_ORDER[number] => !!modifier)
        )
    ).sort((left, right) => MODIFIER_ORDER.indexOf(left) - MODIFIER_ORDER.indexOf(right))

    return [...modifiers, key].filter(Boolean).join('+')
}

export const normalizeKeySequence = (keySequenceString: KeySequenceString) =>
    keySequenceString.split(' ').map(normalizeKeyChord).filter(Boolean).join(' ')

export const keyChordFromEvent = (event: KeyboardEvent) => {
    const key = normalizeKey(event.key)
    if (!key || MODIFIER_ALIASES[key]) {
        return null
    }

    const modifiers = MODIFIER_ORDER.filter(modifier => {
        if (modifier === 'command') {
            return event.metaKey
        }
        if (modifier === 'ctrl') {
            return event.ctrlKey
        }
        if (modifier === 'alt') {
            return event.altKey
        }
        return event.shiftKey
    })

    return [...modifiers, key].join('+')
}

export const createSingleChordCaptureBindings = (
    keyMap: Dictionary<KeySequenceString>,
    handlers: Dictionary<Handler>
): Dictionary<Handler> =>
    Object.keys(keyMap).reduce<Dictionary<Handler>>((captureBindings, id) => {
        const handler = handlers[id]
        const keySequence = normalizeKeySequence(keyMap[id])

        if (!handler || !keySequence || keySequence.includes(' ')) {
            return captureBindings
        }

        return {
            ...captureBindings,
            [keySequence]: handler,
        }
    }, {})
