import {KeyChord} from './key-chord'

export type KeySequenceString = string

/**
 * These keys should not trigger other handlers in the middle of an existing handler.
 * Allow the others to run concurrently though, so the UI feels more responsive.
 */
const KEYS_THAT_WE_ALSO_SIMULATE: KeySequenceString[] = ['Escape', 'tab', 'shift+tab']

/**
 * A "KeySequence" is a series of one or more KeyChords to press in succession, separated by space.
 * For example: 'g g' or just 'alt+D'
 */
export class KeySequence {
    public keyChords: KeyChord[]

    constructor(keyChords: KeyChord[]) {
        this.keyChords = keyChords
    }

    usesMultipleKeyChords(): boolean {
        return this.keyChords.length > 1
    }

    mightBeSimulated(): boolean {
        return KEYS_THAT_WE_ALSO_SIMULATE.includes(this.toString())
    }

    /**
     * @return a space-separated key sequence string like `g g` or `shift+h`
     */
    toString(): string {
        return this.keyChords.join(' ')
    }

    map(mapFn: (keyChord: KeyChord) => KeyChord): KeySequence {
        return new KeySequence(this.keyChords.map(mapFn))
    }

    static fromString(keySequenceString: KeySequenceString) {
        return new KeySequence(keySequenceString.split(' ').map(KeyChord.fromString))
    }
}
