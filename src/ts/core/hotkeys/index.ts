import {tinykeys} from 'tinykeys'
import {Dictionary} from 'lodash'

import {Handler} from './simulation-guard'
import {KeySequenceString} from './key-sequence'
import {createTinykeysKeyMap, syncKeyboardLayoutMap} from './tinykeys'

type Params = {
    keyMap: Dictionary<KeySequenceString>
    handlers: Dictionary<Handler>
}

export const registerHotkeys = async ({keyMap, handlers}: Params) => {
    await syncKeyboardLayoutMap()
    const tinykeysKeyMap = createTinykeysKeyMap(keyMap, handlers)
    if (Object.keys(tinykeysKeyMap).length === 0) {
        return () => {}
    }

    return tinykeys(window, tinykeysKeyMap, {capture: true})
}
