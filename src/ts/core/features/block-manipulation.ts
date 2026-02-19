import {copyBlockEmbed, copyBlockReference} from 'src/core/roam/block'

import {Selectors} from 'src/core/roam/selectors'

import {Feature, Shortcut} from '../settings'
import {RoamNode, Selection} from '../roam/roam-node'
import {Roam} from '../roam/roam'

export const config: Feature = {
    id: 'block_manipulation',
    name: 'Block manipulation',
    settings: [
        {
            type: 'shortcut',
            id: 'duplicateBlockOrSelection',
            label: 'Duplicate block or selection',
            initValue: 'Meta+shift+d',
            onPress: () => duplicate(),
        } as Shortcut,
        {
            type: 'shortcut',
            id: 'deleteBlock',
            label: 'Delete block',
            initValue: 'Alt+k',
            placeholder: 'e.g. cmd+shift+backspace',
            onPress: () => Roam.deleteBlock(),
        } as Shortcut,
        {
            type: 'shortcut',
            id: 'copyBlockRef',
            label: 'Copy Block Reference',
            initValue: 'ctrl+shift+c',
            onPress: () => copyBlockReference(Roam.getRoamBlockInput()?.id),
        } as Shortcut,
        {
            type: 'shortcut',
            id: 'copyBlockEmbed',
            label: 'Copy Block Embed',
            initValue: 'ctrl+meta+c',
            onPress: () => copyBlockEmbed(Roam.getRoamBlockInput()?.id),
        } as Shortcut,
        {
            type: 'shortcut',
            id: 'collapseBlockIntoParent',
            label: 'Collapse block into parent',
            initValue: 'Meta+shift+up',
            onPress: () => collapseBlockIntoParent(),
        } as Shortcut,
    ],
}

const collapseBlockIntoParent = async () => {
    const input = Roam.getRoamBlockInput()
    if (!input) return

    // Walk up: current block container -> parent block container
    const currentContainer = input.closest(Selectors.blockContainer)
    const parentContainer = currentContainer?.parentElement?.closest(Selectors.blockContainer)
    if (!parentContainer) return

    const parentBlock = parentContainer.querySelector(Selectors.block) as HTMLElement
    if (!parentBlock) return

    // Collapse the parent (folds its children, hiding the current block)
    await Roam.toggleFoldBlock(parentBlock)
    // Focus the parent block
    await Roam.activateBlock(parentBlock)
}

const duplicate = () => {
    const node = Roam.getActiveRoamNode()
    const selectedText = node?.selectedText()

    if (node && selectedText) {
        const newText = node.textBeforeSelection() + selectedText + selectedText + node.textAfterSelection()
        Roam.save(new RoamNode(newText, new Selection(node.selection.end, node.selection.end + selectedText.length)))
    } else {
        Roam.duplicateBlock()
    }
}
