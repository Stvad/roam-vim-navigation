import {startVimMode, stopVimMode} from 'src/core/features/vim-mode/vim-init'
import {map, nmap, returnToNormalMode} from 'src/core/features/vim-mode/vim'
import {NavigationCommands} from 'src/core/features/vim-mode/commands/navigation-commands'
import {HistoryCommands} from 'src/core/features/vim-mode/commands/history-commands'
import {InsertCommands} from 'src/core/features/vim-mode/commands/insert-commands'
import {ClipboardCommands} from 'src/core/features/vim-mode/commands/clipboard-commands'
import {PanelCommands} from 'src/core/features/vim-mode/commands/panel-commands'
import {VisualCommands} from 'src/core/features/vim-mode/commands/visual-commands'
import {BlockManipulationCommands} from 'src/core/features/vim-mode/commands/block-manipulation-commands'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {HintCommands} from 'src/core/features/vim-mode/commands/hint-commands'
import {EditCommands} from 'src/core/features/vim-mode/commands/edit-commands'
import {Shortcut} from 'src/core/features/vim-mode/types'

export const VIM_SHORTCUTS: Shortcut[] = [
    map('Escape', 'Exit to Normal Mode', returnToNormalMode),
    nmap('z', 'Toggle Fold Block', () => RoamBlock.selected().toggleFold()),
    ...NavigationCommands,
    ...PanelCommands,
    ...InsertCommands,
    ...HistoryCommands,
    ...ClipboardCommands,
    ...VisualCommands,
    ...BlockManipulationCommands,
    ...HintCommands,
    ...EditCommands,
]

export const getPrimaryHintShortcut = (hintId: number) =>
    VIM_SHORTCUTS.find(shortcut => shortcut.label === `Click Hint ${hintId}`)

export {startVimMode, stopVimMode}
