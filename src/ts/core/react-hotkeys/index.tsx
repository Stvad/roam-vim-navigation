import React from 'react'
import {Dictionary} from 'lodash'

import {Handler} from './key-handler'
import {KeySequenceString} from './key-sequence'
import {tinykeys} from './tinykeys-lib'
import {createTinykeysKeyMap} from './tinykeys'

type Props = {
    keyMap: Dictionary<KeySequenceString>
    handlers: Dictionary<Handler>
}

/**
 * Keep the existing component boundary, but delegate actual keyboard matching to tinykeys.
 */
export const ReactHotkeys = ({keyMap, handlers}: Props) => {
    const tinykeysKeyMap = React.useMemo(() => createTinykeysKeyMap(keyMap, handlers), [handlers, keyMap])

    React.useEffect(() => {
        if (Object.keys(tinykeysKeyMap).length === 0) {
            return
        }

        return tinykeys(window, tinykeysKeyMap, {capture: true})
    }, [tinykeysKeyMap])

    return null
}
