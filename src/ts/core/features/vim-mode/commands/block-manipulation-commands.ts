import {nimap, nmap} from 'src/core/features/vim-mode/vim'
import {Keyboard} from 'src/core/common/keyboard'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {getBlockUid} from 'src/core/roam/block'
import {RoamDb} from 'src/core/roam/roam-db'
import {Selectors} from 'src/core/roam/selectors'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'

const moveBlockUp = async () => {
    RoamBlock.selected().edit()
    await Keyboard.simulateKey(Keyboard.UP_ARROW, 0, {metaKey: true, shiftKey: true})
}

const moveBlockDown = async () => {
    RoamBlock.selected().edit()
    await Keyboard.simulateKey(Keyboard.DOWN_ARROW, 0, {metaKey: true, shiftKey: true})
}

const collapseIntoParent = () => {
    const selected = RoamBlock.selected()
    const uid = getBlockUid(selected.id)
    const parentUid = RoamDb.getParentBlockUid(uid)
    if (!parentUid) return

    RoamDb.setBlockOpen(parentUid, false)

    const parentBlock = document.querySelector(`${Selectors.block}[id$="${parentUid}"]`) as HTMLElement
    if (parentBlock) {
        VimRoamPanel.selected().selectBlock(parentBlock.id)
    }
}

export const BlockManipulationCommands = [
    nimap('command+shift+h', 'Move Block Up', moveBlockUp),
    nimap('command+shift+k', 'Move Block Down', moveBlockDown),
    nmap('shift+z', 'Collapse Into Parent', collapseIntoParent),
]
