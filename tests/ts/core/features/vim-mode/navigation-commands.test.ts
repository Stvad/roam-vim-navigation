jest.mock('src/core/features/vim-mode/vim', () => {
    const mapShortcut = (key: string, label: string, onPress: (...args: any[]) => unknown) => ({
        initValue: key,
        label,
        onPress,
    })

    return {
        nmap: mapShortcut,
        nimap: mapShortcut,
        nvmap: mapShortcut,
        RoamVim: {
            jumpBlocksInFocusedPanel: jest.fn(),
        },
    }
})

jest.mock('src/core/roam/references', () => ({
    closePageReferenceView: jest.fn(() => Promise.resolve()),
    expandLastBreadcrumb: jest.fn(),
    openMentions: jest.fn(),
    openParentPage: jest.fn(),
}))

jest.mock('src/core/features/vim-mode/roam/roam-block', () => ({
    RoamBlock: {
        selected: jest.fn(),
    },
}))

jest.mock('src/core/features/vim-mode/roam/roam-vim-panel', () => ({
    VimRoamPanel: {
        selected: jest.fn(),
    },
}))

import {NavigationCommands} from 'src/core/features/vim-mode/commands/navigation-commands'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {closePageReferenceView} from 'src/core/roam/references'

describe('Shift+Z reference collapse', () => {
    const selected = RoamBlock.selected as jest.MockedFunction<typeof RoamBlock.selected>
    const selectedPanel = VimRoamPanel.selected as jest.MockedFunction<typeof VimRoamPanel.selected>
    const closeReferenceView = closePageReferenceView as jest.MockedFunction<typeof closePageReferenceView>
    const event = {} as KeyboardEvent

    beforeEach(() => {
        jest.clearAllMocks()
        document.body.innerHTML = ''
    })

    it('re-scrolls to the newly selected block after collapsing a reference view', async () => {
        document.body.innerHTML = `
            <div class="rm-reference-item">
                <div id="selected-block" class="roam-block"></div>
            </div>
            <div class="rm-reference-item">
                <div id="next-block" class="roam-block"></div>
            </div>
        `

        const currentBlock = document.getElementById('selected-block') as HTMLElement
        const nextBlock = document.getElementById('next-block') as HTMLElement
        const panel = {
            scrollUntilBlockIsVisible: jest.fn(),
            selectBlock: jest.fn(),
            selectedBlock: jest.fn(() => ({element: nextBlock})),
        }

        selected.mockReturnValue({element: currentBlock} as ReturnType<typeof RoamBlock.selected>)
        selectedPanel.mockReturnValue(panel as unknown as ReturnType<typeof VimRoamPanel.selected>)
        closeReferenceView.mockResolvedValue(undefined)

        const shortcut = NavigationCommands.find(command => command.initValue === 'shift+z')
        await shortcut?.onPress(event)

        expect(closeReferenceView).toHaveBeenCalledTimes(1)
        expect(panel.selectBlock).toHaveBeenCalledWith('next-block')
        expect(panel.scrollUntilBlockIsVisible).toHaveBeenCalledWith(nextBlock)
    })

    it('still scrolls the active block into view when there is no next reference item', async () => {
        document.body.innerHTML = `
            <div class="rm-reference-item">
                <div id="selected-block" class="roam-block"></div>
            </div>
        `

        const currentBlock = document.getElementById('selected-block') as HTMLElement
        const panel = {
            scrollUntilBlockIsVisible: jest.fn(),
            selectBlock: jest.fn(),
            selectedBlock: jest.fn(() => ({element: currentBlock})),
        }

        selected.mockReturnValue({element: currentBlock} as ReturnType<typeof RoamBlock.selected>)
        selectedPanel.mockReturnValue(panel as unknown as ReturnType<typeof VimRoamPanel.selected>)
        closeReferenceView.mockResolvedValue(undefined)

        const shortcut = NavigationCommands.find(command => command.initValue === 'shift+z')
        await shortcut?.onPress(event)

        expect(panel.selectBlock).not.toHaveBeenCalled()
        expect(panel.scrollUntilBlockIsVisible).toHaveBeenCalledWith(currentBlock)
    })
})
