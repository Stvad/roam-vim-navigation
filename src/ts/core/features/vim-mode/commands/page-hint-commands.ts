import {nmap} from 'src/core/features/vim-mode/vim'
import {startPageHintSession} from 'src/core/features/vim-mode/page-hint-view'

export const PageHintCommands = [
    nmap('s', 'Hint Visible Targets', () => startPageHintSession('normal'), {consumeEvent: true}),
    nmap('shift+i', 'Hint Visible Targets and Enter Insert Mode', () => startPageHintSession('insert'), {
        consumeEvent: true,
    }),
]
