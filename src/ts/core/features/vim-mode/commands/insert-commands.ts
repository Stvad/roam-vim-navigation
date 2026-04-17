import {Keyboard} from 'src/core/common/keyboard'
import {Roam} from 'src/core/roam/roam'
import {nmap} from 'src/core/features/vim-mode/vim'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {Selectors} from 'src/core/roam/selectors'

const usesNativeInsertFallback = (targetBlock: HTMLElement) =>
    Boolean(
        targetBlock.closest(`${Selectors.referenceItem}, ${Selectors.inlineReference}, ${Selectors.blockReference}`),
    )

const editBlock = async () => {
    const targetBlock = RoamBlock.selected().element
    if (usesNativeInsertFallback(targetBlock)) {
        await Roam.activateBlock(targetBlock)
        await Roam.moveCursorToStart()
        return
    }

    Roam.focusBlockAtStart(targetBlock)
}

const editBlockFromEnd = async () => {
    const targetBlock = RoamBlock.selected().element
    if (usesNativeInsertFallback(targetBlock)) {
        await Roam.activateBlock(targetBlock)
        await Roam.moveCursorToEnd()
        return
    }

    Roam.focusBlockAtEnd(targetBlock)
}

const insertBlockBefore = async () => {
    const targetBlock = RoamBlock.selected().element
    if (usesNativeInsertFallback(targetBlock)) {
        await Roam.activateBlock(targetBlock)
        await Roam.moveCursorToStart()
        await Keyboard.pressEnter()
        return
    }

    await Roam.createSiblingAbove(targetBlock)
}

export const insertBlockAfter = async () => {
    const targetBlock = RoamBlock.selected().element
    if (usesNativeInsertFallback(targetBlock)) {
        await Roam.activateBlock(targetBlock)
        await Roam.moveCursorToEnd()
        await Keyboard.pressEnter()
        return
    }

    await Roam.createBlockBelow(targetBlock)
}

export const InsertCommands = [
    nmap('i', 'Click Selection', editBlock),
    nmap('a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+o', 'Insert Block Before', insertBlockBefore),
    nmap('o', 'Insert Block After', insertBlockAfter),
]
