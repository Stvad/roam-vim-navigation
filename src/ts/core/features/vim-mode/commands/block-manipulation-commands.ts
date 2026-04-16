import {nimap, nmap} from 'src/core/features/vim-mode/vim'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {getBlockUid} from 'src/core/roam/block'
import {RoamDb} from 'src/core/roam/roam-db'
import {Selectors} from 'src/core/roam/selectors'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {Roam} from 'src/core/roam/roam'

const selectionParams = (start: number, end: number) => (start === end ? {start} : {start, end})

const moveSelectedBlock = async (offset: number) => {
    const uid = getBlockUid(RoamBlock.selected().id)
    const parentUid = RoamDb.getParentBlockUid(uid)
    const order = RoamDb.getBlockOrder(uid)
    if (!parentUid || order === null) return

    const siblings = RoamDb.getChildBlockUids(parentUid)
    const targetOrder = order + offset
    if (targetOrder < 0 || targetOrder >= siblings.length) return

    const focusedBlock = RoamDb.getFocusedBlock()
    const activeNode = focusedBlock?.['block-uid'] === uid ? Roam.getActiveRoamNode() : null

    const reorderedSiblings = [...siblings]
    ;[reorderedSiblings[order], reorderedSiblings[targetOrder]] = [
        reorderedSiblings[targetOrder],
        reorderedSiblings[order],
    ]

    await RoamDb.reorderBlocks({parentUid, blockUids: reorderedSiblings})

    if (focusedBlock?.['block-uid'] === uid && activeNode) {
        RoamDb.focusBlock(
            {...focusedBlock, 'block-uid': uid},
            selectionParams(activeNode.selection.start, activeNode.selection.end)
        )
    }
}

const moveBlockUp = () => moveSelectedBlock(-1)

const moveBlockDown = () => moveSelectedBlock(1)

const collapseIntoParent = async () => {
    const selected = RoamBlock.selected()
    const uid = getBlockUid(selected.id)
    const parentUid = RoamDb.getParentBlockUid(uid)
    if (!parentUid) return

    const parentBlock = document.querySelector(`${Selectors.block}[id$="${parentUid}"]`) as HTMLElement
    if (!parentBlock) {
        return
    }

    await RoamDb.setBlockOpen(parentUid, false)
    VimRoamPanel.selected().selectBlock(parentBlock.id)
}

export const BlockManipulationCommands = [
    nimap('command+shift+h', 'Move Block Up', moveBlockUp, {consumeEvent: true}),
    nimap('command+shift+k', 'Move Block Down', moveBlockDown, {consumeEvent: true}),
    nmap('shift+ctrl+z', 'Collapse Into Parent', collapseIntoParent),
]
