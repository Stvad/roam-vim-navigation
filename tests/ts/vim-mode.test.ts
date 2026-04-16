jest.mock('src/core/features/vim-mode/vim-view', () => ({
    blurEverything: jest.fn(),
    updateVimView: jest.fn(),
}))

jest.mock('src/core/common/dom', () => ({
    getActiveEditElement: jest.fn(),
}))

jest.mock('src/core/features/vim-mode/roam/roam-vim-panel', () => ({
    VimRoamPanel: {},
}))

jest.mock('src/core/common/keyboard', () => ({
    Keyboard: {},
}))

jest.mock('src/core/features/vim-mode/roam/roam-highlight', () => ({
    RoamHighlight: {},
}))

jest.mock('src/core/features/vim-mode/roam/roam-block', () => ({
    RoamBlock: {
        selected: jest.fn(),
    },
}))

jest.mock('src/core/roam/roam-db', () => ({
    RoamDb: {
        focusBlock: jest.fn(),
        getBlockOrder: jest.fn(),
        getChildBlockUids: jest.fn(),
        getFocusedBlock: jest.fn(),
        getParentBlockUid: jest.fn(),
        reorderBlocks: jest.fn(),
        setBlockOpen: jest.fn(),
    },
}))

jest.mock('src/core/roam/roam', () => ({
    Roam: {
        getActiveRoamNode: jest.fn(),
    },
}))

import {getActiveEditElement} from 'src/core/common/dom'
import {BlockManipulationCommands} from 'src/core/features/vim-mode/commands/block-manipulation-commands'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {nmap} from 'src/core/features/vim-mode/vim'
import {Roam} from 'src/core/roam/roam'
import {RoamDb} from 'src/core/roam/roam-db'
import {updateVimView} from 'src/core/features/vim-mode/vim-view'

describe('Vim mode shortcuts', () => {
    const mockGetActiveEditElement = getActiveEditElement as jest.MockedFunction<typeof getActiveEditElement>
    const mockGetActiveRoamNode = Roam.getActiveRoamNode as jest.MockedFunction<typeof Roam.getActiveRoamNode>
    const mockGetBlockOrder = RoamDb.getBlockOrder as jest.MockedFunction<typeof RoamDb.getBlockOrder>
    const mockGetChildBlockUids = RoamDb.getChildBlockUids as jest.MockedFunction<typeof RoamDb.getChildBlockUids>
    const mockGetFocusedBlock = RoamDb.getFocusedBlock as jest.MockedFunction<typeof RoamDb.getFocusedBlock>
    const mockGetParentBlockUid = RoamDb.getParentBlockUid as jest.MockedFunction<typeof RoamDb.getParentBlockUid>
    const mockReorderBlocks = RoamDb.reorderBlocks as jest.MockedFunction<typeof RoamDb.reorderBlocks>
    const mockSelectedBlock = RoamBlock.selected as jest.MockedFunction<typeof RoamBlock.selected>
    const mockUpdateVimView = updateVimView as jest.MockedFunction<typeof updateVimView>

    beforeEach(() => {
        jest.clearAllMocks()
        document.body.innerHTML = ''
        mockGetActiveEditElement.mockReturnValue(null)
        mockReorderBlocks.mockResolvedValue(undefined)
    })

    it('does not consume handled keyboard events unless requested', async () => {
        const handler = jest.fn()
        const shortcut = nmap('cmd+enter', 'Toggle done', handler)
        const nativeEvent = {stopImmediatePropagation: jest.fn()}
        const event = ({
            nativeEvent,
            preventDefault: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            stopPropagation: jest.fn(),
        } as unknown) as KeyboardEvent

        await shortcut.onPress(event)

        expect(event.preventDefault).not.toHaveBeenCalled()
        expect(event.stopPropagation).not.toHaveBeenCalled()
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled()
        expect(nativeEvent.stopImmediatePropagation).not.toHaveBeenCalled()
        expect(handler).toHaveBeenCalledWith(expect.any(Number), event)
        expect(mockUpdateVimView).toHaveBeenCalled()
    })

    it('consumes handled keyboard events when requested', async () => {
        const handler = jest.fn()
        const shortcut = nmap('cmd+enter', 'Toggle done', handler, {consumeEvent: true})
        const nativeEvent = {stopImmediatePropagation: jest.fn()}
        const event = ({
            nativeEvent,
            preventDefault: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            stopPropagation: jest.fn(),
        } as unknown) as KeyboardEvent

        await shortcut.onPress(event)

        expect(event.preventDefault).toHaveBeenCalled()
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(event.stopImmediatePropagation).toHaveBeenCalled()
        expect(nativeEvent.stopImmediatePropagation).toHaveBeenCalled()
        expect(handler).toHaveBeenCalledWith(expect.any(Number), event)
        expect(mockUpdateVimView).toHaveBeenCalled()
    })

    it('ignores normal mode shortcuts outside normal mode', async () => {
        mockGetActiveEditElement.mockReturnValue(document.createElement('textarea'))

        const handler = jest.fn()
        const shortcut = nmap('cmd+enter', 'Toggle done', handler)
        const event = ({
            preventDefault: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            stopPropagation: jest.fn(),
        } as unknown) as KeyboardEvent

        await shortcut.onPress(event)

        expect(event.preventDefault).not.toHaveBeenCalled()
        expect(event.stopPropagation).not.toHaveBeenCalled()
        expect(handler).not.toHaveBeenCalled()
        expect(mockUpdateVimView).not.toHaveBeenCalled()
    })

    it('creates unique ids for shortcuts that share a label', () => {
        const firstShortcut = nmap('a', 'Click Selection and Go-to End of Line', jest.fn())
        const secondShortcut = nmap('shift+a', 'Click Selection and Go-to End of Line', jest.fn())

        expect(firstShortcut.id).not.toEqual(secondShortcut.id)
    })

    it('consumes move-block shortcuts in insert mode', async () => {
        mockGetActiveEditElement.mockReturnValue(document.createElement('textarea'))
        mockSelectedBlock.mockReturnValue(({id: 'block-abc123xyz'} as unknown) as ReturnType<typeof RoamBlock.selected>)
        mockGetParentBlockUid.mockReturnValue('parent123')
        mockGetBlockOrder.mockReturnValue(1)
        mockGetChildBlockUids.mockReturnValue(['first1111', 'abc123xyz', 'third3333'])
        mockGetFocusedBlock.mockReturnValue({'block-uid': 'abc123xyz', 'window-id': 'main-window'})
        mockGetActiveRoamNode.mockReturnValue({selection: {start: 1, end: 1}} as ReturnType<
            typeof Roam.getActiveRoamNode
        >)

        const moveBlockUpShortcut = BlockManipulationCommands[0]
        const nativeEvent = {stopImmediatePropagation: jest.fn()}
        const event = ({
            nativeEvent,
            preventDefault: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            stopPropagation: jest.fn(),
        } as unknown) as KeyboardEvent

        await moveBlockUpShortcut.onPress(event)

        expect(event.preventDefault).toHaveBeenCalled()
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(event.stopImmediatePropagation).toHaveBeenCalled()
        expect(nativeEvent.stopImmediatePropagation).toHaveBeenCalled()
        expect(mockReorderBlocks).toHaveBeenCalled()
        expect(mockUpdateVimView).toHaveBeenCalled()
    })
})
