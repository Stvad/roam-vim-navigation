import React from 'react'
import {configure} from 'react-hotkeys'
import {Dictionary, mapValues} from 'lodash'

import {CODE_TO_KEY} from 'src/core/common/keycodes'

import {blockConcurrentHandlingOfSimulatedKeys, Handler} from './key-handler'
import {GlobalHotKeysWithoutConflictingWithNativeHotkeys} from './dont-override-native-hotkeys'
import {KeySequence, KeySequenceString} from 'src/core/react-hotkeys/key-sequence'
import {zipObjects} from 'src/core/common/object'
import {clearKeyPressesAfterFinishingKeySequence} from 'src/core/react-hotkeys/key-history'
import {createSingleChordCaptureBindings, keyChordFromEvent, normalizeKeySequence} from './capture-hotkeys'

configure({
    ignoreTags: [],
    ignoreRepeatedEventsWhenKeyHeldDown: false,
    /**
     * simulateMissingKeyPressEvents emits ctrl+u when holding down ctrl
     * and pressing u, otherwise only u is emitted
     */
    simulateMissingKeyPressEvents: true,
    /**
     * Allow event propagation. Plain key bindings like `u` shouldn't clobber shortcuts like `cmd+u`
     *https://github.com/greena13/react-hotkeys/issues/249
     */
    stopEventPropagationAfterHandling: false,
    stopEventPropagationAfterIgnoring: false,
    /**
     * React Hotkeys treats j/J as different keys, which is buggy when detecting key chords.
     * For example, if I press these keys:
     *
     *     [shift down, j down, shift up, j up]
     *
     * React Hotkeys interprets it like so:
     *
     *            ---------Shift+J-------
     *            |                     |
     *     [Shift+J down, J down, Shift+J up, j up]
     *                       |                  |
     *                       ----Not Released----
     *
     * React Hotkeys thinks that the "J" key is still down, which breaks all hotkeys until you
     * Un-focus the browser window (resetting the key history).
     *
     * To workaround this issue, we normalize j/J to be the "same key" using the keycode,
     * That way, a "J" keydown is stored as a "j" keydown in the key history, so a "j" keyup
     * will "release" it.
     *
     * Related issue: https://github.com/greena13/react-hotkeys/issues/249
     */
    customKeyCodes: CODE_TO_KEY,
})

type Props = {
    keyMap: Dictionary<KeySequenceString>
    handlers: Dictionary<Handler>
    captureKeyMap?: Dictionary<KeySequenceString>
    captureHandlers?: Dictionary<Handler>
}

/**
 * Wrap react-hotkeys to make it behave in a convenient way.
 *
 * Also works around some of it's issues. React Hotkeys doesn't have an active maintainer,
 * so these issues are harder to fix upstream.
 *
 * See https://github.com/roam-unofficial/roam-toolkit/issues/68
 * for discussion around alternatives to react-hotkeys.
 */
export const ReactHotkeys = ({keyMap, handlers, captureKeyMap = {}, captureHandlers = {}}: Props) => {
    /**
     * Key sequences like 'g g' mess up the other shortcuts
     * See https://github.com/greena13/react-hotkeys/issues/229
     * And https://github.com/greena13/react-hotkeys/issues/219
     *
     * Workaround by separating sequences and single chords into different react components:
     * https://github.com/greena13/react-hotkeys/issues/219#issuecomment-540680435
     */
    const hotkeys: Dictionary<Hotkey> = mapValues(
        zipObjects(keyMap, handlers),
        ([keySequenceString, handler]): Hotkey => [KeySequence.fromString(keySequenceString), handler]
    )

    const captureBindings = React.useMemo(() => createSingleChordCaptureBindings(captureKeyMap, captureHandlers), [
        captureHandlers,
        captureKeyMap,
    ])
    const capturedHotkeyIds = React.useMemo(
        () =>
            Object.keys(captureKeyMap).filter(id => {
                const keySequence = captureKeyMap[id]
                return !!captureHandlers[id] && !!keySequence && !normalizeKeySequence(keySequence).includes(' ')
            }),
        [captureHandlers, captureKeyMap]
    )

    React.useEffect(() => {
        if (Object.keys(captureBindings).length === 0) {
            return
        }

        const onKeyDownCapture = (event: KeyboardEvent) => {
            const handler = captureBindings[keyChordFromEvent(event) ?? '']
            if (handler) {
                void handler(event)
            }
        }

        window.addEventListener('keydown', onKeyDownCapture, true)
        return () => window.removeEventListener('keydown', onKeyDownCapture, true)
    }, [captureBindings])

    const hotkeysWithoutCapturedSingles = removeHotkeys(hotkeys, capturedHotkeyIds)
    const singleChordHotkeys = filterHotkeys(hotkeysWithoutCapturedSingles, usesOneKeyChord)
    const multiChordHotkeys = filterHotkeys(hotkeysWithoutCapturedSingles, usesMultipleKeyChords)

    return (
        <>
            <GlobalHotKeysWithoutConflictingWithNativeHotkeys
                keyMap={mapValues(singleChordHotkeys, toKeySequence)}
                handlers={mapValues(singleChordHotkeys, toHandler)}
            />
            <GlobalHotKeysWithoutConflictingWithNativeHotkeys
                keyMap={mapValues(multiChordHotkeys, toKeySequence)}
                handlers={mapValues(multiChordHotkeys, toHandler)}
            />
        </>
    )
}

type Hotkey = [KeySequence, Handler]

const filterHotkeys = (hotkeys: Dictionary<Hotkey>, predicate: (hotkey: Hotkey) => boolean) =>
    Object.keys(hotkeys).reduce<Dictionary<Hotkey>>((filteredHotkeys, id) => {
        const hotkey = hotkeys[id]
        if (hotkey && predicate(hotkey)) {
            filteredHotkeys[id] = hotkey
        }
        return filteredHotkeys
    }, {})

const removeHotkeys = (hotkeys: Dictionary<Hotkey>, idsToRemove: string[]) =>
    Object.keys(hotkeys).reduce<Dictionary<Hotkey>>((remainingHotkeys, id) => {
        if (!idsToRemove.includes(id)) {
            remainingHotkeys[id] = hotkeys[id]
        }
        return remainingHotkeys
    }, {})

const usesMultipleKeyChords = ([keySequence]: Hotkey) => keySequence.usesMultipleKeyChords()
const usesOneKeyChord = ([keySequence]: Hotkey) => !keySequence.usesMultipleKeyChords()
const toKeySequence = ([keySequence]: Hotkey) => keySequence.toString()
const toHandler = ([keySequence, handler]: Hotkey) =>
    blockConcurrentHandlingOfSimulatedKeys(keySequence, clearKeyPressesAfterFinishingKeySequence(keySequence, handler))
