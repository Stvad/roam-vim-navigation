import {nmap} from 'src/core/features/vim-mode/vim'
import {startPageHintSession} from 'src/core/features/vim-mode/page-hint-view'

export const PageHintCommands = [
    nmap('s', 'Hint Visible Blocks', () => startPageHintSession('normal', 'blocks'), {consumeEvent: true}),
    nmap('shift+s', 'Hint Visible Targets', () => startPageHintSession('normal'), {consumeEvent: true}),
    nmap('g l', 'Hint Visible Links', () => startPageHintSession('normal', 'links'), {consumeEvent: true}),
    nmap('shift+i', 'Hint Visible Blocks and Enter Insert Mode', () => startPageHintSession('insert', 'blocks'), {
        consumeEvent: true,
    }),
]
