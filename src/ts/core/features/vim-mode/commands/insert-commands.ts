import {Roam} from 'src/core/roam/roam'
import {nmap} from 'src/core/features/vim-mode/vim'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'

export const insertBlockAfter = async () => {
    await Roam.createBlockBelow(RoamBlock.selected().element)
}

const editBlock = async () => {
    Roam.focusBlockAtStart(RoamBlock.selected().element)
}

const editBlockFromEnd = async () => {
    Roam.focusBlockAtEnd(RoamBlock.selected().element)
}

const insertBlockBefore = async () => {
    await Roam.createSiblingAbove(RoamBlock.selected().element)
}

export const InsertCommands = [
    nmap('i', 'Click Selection', editBlock),
    nmap('a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+a', 'Click Selection and Go-to End of Line', editBlockFromEnd),
    nmap('shift+o', 'Insert Block Before', insertBlockBefore),
    nmap('o', 'Insert Block After', insertBlockAfter),
]
