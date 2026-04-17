import {Roam} from 'src/core/roam/roam'
import {nmap} from 'src/core/features/vim-mode/vim'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'

const editBlock = async () => {
    const targetBlock = RoamBlock.selected().element
    Roam.focusBlockAtStart(targetBlock)
}

const editBlockFromEnd = async () => {
    const targetBlock = RoamBlock.selected().element
    Roam.focusBlockAtEnd(targetBlock)
}

const insertBlockBefore = async () => {
    const targetBlock = RoamBlock.selected().element
    await Roam.createSiblingAbove(targetBlock)
}

export const insertBlockAfter = async () => {
    const targetBlock = RoamBlock.selected().element
    await Roam.createBlockBelow(targetBlock)
}

export const InsertCommands = [
    nmap('i', 'Click Selection', editBlock),
    nmap('a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+o', 'Insert Block Before', insertBlockBefore),
    nmap('o', 'Insert Block After', insertBlockAfter),
]
