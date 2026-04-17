import {tinykeys} from 'tinykeys'
import {Dictionary} from 'lodash'

import {Handler} from './simulation-guard'
import {KeySequenceString} from './key-sequence'
import {createTinykeysKeyMap} from './tinykeys'

type Params = {
    keyMap: Dictionary<KeySequenceString>
    handlers: Dictionary<Handler>
}

export const registerHotkeys = ({keyMap, handlers}: Params) => {
    const tinykeysKeyMap = createTinykeysKeyMap(keyMap, handlers)
    if (Object.keys(tinykeysKeyMap).length === 0) {
        return () => {}
    }

    return tinykeys(window, tinykeysKeyMap, {capture: true})
}
