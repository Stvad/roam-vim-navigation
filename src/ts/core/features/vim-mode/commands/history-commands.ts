import {nmap, returnToNormalMode} from 'src/core/features/vim-mode/vim'
import {RoamDb} from 'src/core/roam/roam-db'

const undo = async () => {
    await RoamDb.undo()
    await returnToNormalMode()
}

const redo = async () => {
    await RoamDb.redo()
    await returnToNormalMode()
}

export const HistoryCommands = [nmap('u', 'Undo', undo), nmap('ctrl+r', 'Redo', redo)]
