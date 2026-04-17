import React from 'react'
import {tinykeys} from 'tinykeys'
import {Dictionary} from 'lodash'

import {Handler} from './simulation-guard'
import {KeySequenceString} from './key-sequence'
import {createTinykeysKeyMap} from './tinykeys'

type Props = {
    keyMap: Dictionary<KeySequenceString>
    handlers: Dictionary<Handler>
}

/**
 * Keep the existing component boundary, but delegate actual keyboard matching to tinykeys.
 */
export const Hotkeys = ({keyMap, handlers}: Props) => {
    const tinykeysKeyMap = React.useMemo(() => createTinykeysKeyMap(keyMap, handlers), [handlers, keyMap])

    React.useEffect(() => {
        if (Object.keys(tinykeysKeyMap).length === 0) {
            return
        }

        return tinykeys(window, tinykeysKeyMap, {capture: true})
    }, [tinykeysKeyMap])

    return null
}
