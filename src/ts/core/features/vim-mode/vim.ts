import {blurEverything, updateVimView} from 'src/core/features/vim-mode/vim-view'
import {getActiveEditElement} from 'src/core/common/dom'
import {Selectors} from 'src/core/roam/selectors'
import {delay, repeatAsync} from 'src/core/common/async'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {Keyboard} from 'src/core/common/keyboard'
import {RoamHighlight} from 'src/core/features/vim-mode/roam/roam-highlight'
import {Shortcut} from './types'

export enum Mode {
    INSERT,
    VISUAL,
    NORMAL,
}

export const getMode = () => {
    if (getActiveEditElement()) {
        return Mode.INSERT
    }

    if (document.querySelector(Selectors.highlight)) {
        return Mode.VISUAL
    }

    return Mode.NORMAL
}

export const returnToNormalMode = async () => {
    blurEverything()
    await delay(0)
    // Clear the native highlight you normally get after blurring a block
    blurEverything()
}

type CommandMapper = (
    key: string,
    label: string,
    onPress: (mode: Mode, event: KeyboardEvent) => void,
    params?: CommandMapperParams
) => Shortcut

type CommandMapperParams = {
    consumeEvent?: boolean
}

type PropagationControllableKeyboardEvent = KeyboardEvent & {
    nativeEvent?: KeyboardEvent & {stopImmediatePropagation?: () => void}
    stopImmediatePropagation?: () => void
}

const consumeKeyboardEvent = (event: KeyboardEvent) => {
    const controllableEvent = event as PropagationControllableKeyboardEvent
    controllableEvent.preventDefault()
    controllableEvent.stopPropagation()
    controllableEvent.stopImmediatePropagation?.()
    controllableEvent.nativeEvent?.stopImmediatePropagation?.()
}

const shortcutId = (label: string, key: string) => `blockNavigationMode_${label}_${key}`

const _map = (modes: Mode[]): CommandMapper => (key, label, onPress, params = {}) => ({
    type: 'shortcut',
    id: shortcutId(label, key),
    label,
    initValue: key,
    onPress: async event => {
        const mode = getMode()
        if (modes.includes(mode)) {
            if (params.consumeEvent) {
                consumeKeyboardEvent(event)
            }
            await onPress(mode, event)
            updateVimView()
        }
    },
})

export const map: CommandMapper = _map([Mode.NORMAL, Mode.VISUAL, Mode.INSERT])
export const nmap: CommandMapper = _map([Mode.NORMAL])
export const nimap: CommandMapper = _map([Mode.NORMAL, Mode.INSERT])
export const nvmap: CommandMapper = _map([Mode.NORMAL, Mode.VISUAL])

export const RoamVim = {
    async jumpBlocksInFocusedPanel(blocksToJump: number) {
        const mode = getMode()
        if (mode === Mode.NORMAL) {
            VimRoamPanel.selected().selectRelativeBlock(blocksToJump)
        }
        if (mode === Mode.VISUAL) {
            await repeatAsync(Math.abs(blocksToJump), () =>
                Keyboard.simulateKey(blocksToJump > 0 ? Keyboard.DOWN_ARROW : Keyboard.UP_ARROW, 0, {shiftKey: true})
            )
            VimRoamPanel.selected().scrollUntilBlockIsVisible(
                blocksToJump > 0 ? RoamHighlight.last() : RoamHighlight.first()
            )
        }
    },
}
