jest.mock('src/core/features/vim-mode/vim', () => ({
    nimap: (_key: string, _label: string, onPress: () => Promise<void> | void) => onPress,
    nmap: (_key: string, _label: string, onPress: () => Promise<void> | void) => onPress,
}))

jest.mock('src/core/common/async', () => ({
    delay: jest.fn().mockResolvedValue(undefined),
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
        moveBlock: jest.fn(),
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

jest.mock('src/core/features/vim-mode/roam/roam-vim-panel', () => ({
    VimRoamPanel: {
        selected: jest.fn(),
    },
}))

import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {delay} from 'src/core/common/async'
import {RoamDb} from 'src/core/roam/roam-db'
import {Roam} from 'src/core/roam/roam'
import {BlockManipulationCommands} from 'src/core/features/vim-mode/commands/block-manipulation-commands'

describe('Block manipulation commands', () => {
    const mockDelay = delay as jest.MockedFunction<typeof delay>
    const selected = RoamBlock.selected as jest.MockedFunction<typeof RoamBlock.selected>
    const moveBlock = RoamDb.moveBlock as jest.MockedFunction<typeof RoamDb.moveBlock>
    const reorderBlocks = RoamDb.reorderBlocks as jest.MockedFunction<typeof RoamDb.reorderBlocks>
    const setBlockOpen = RoamDb.setBlockOpen as jest.MockedFunction<typeof RoamDb.setBlockOpen>
    const focusBlock = RoamDb.focusBlock as jest.MockedFunction<typeof RoamDb.focusBlock>
    const getBlockOrder = RoamDb.getBlockOrder as jest.MockedFunction<typeof RoamDb.getBlockOrder>
    const getChildBlockUids = RoamDb.getChildBlockUids as jest.MockedFunction<typeof RoamDb.getChildBlockUids>
    const getFocusedBlock = RoamDb.getFocusedBlock as jest.MockedFunction<typeof RoamDb.getFocusedBlock>
    const getParentBlockUid = RoamDb.getParentBlockUid as jest.MockedFunction<typeof RoamDb.getParentBlockUid>
    const getActiveRoamNode = Roam.getActiveRoamNode as jest.MockedFunction<typeof Roam.getActiveRoamNode>

    beforeEach(() => {
        jest.clearAllMocks()
        mockDelay.mockResolvedValue(undefined)
        moveBlock.mockResolvedValue(undefined)
        reorderBlocks.mockResolvedValue(undefined)
        setBlockOpen.mockResolvedValue(undefined)
    })

    it('reorders sibling blocks when moving the selected block down', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockReturnValue('parent123')
        getBlockOrder.mockReturnValue(1)
        getChildBlockUids.mockReturnValue(['first1111', 'abc123xyz', 'third3333'])
        getFocusedBlock.mockReturnValue({'block-uid': 'abc123xyz', 'window-id': 'main-window'})
        getActiveRoamNode.mockReturnValue({selection: {start: 2, end: 4}} as ReturnType<typeof Roam.getActiveRoamNode>)

        const moveBlockDown = BlockManipulationCommands[1] as unknown as () => Promise<void>
        await moveBlockDown()

        expect(reorderBlocks).toHaveBeenCalledWith({
            parentUid: 'parent123',
            blockUids: ['first1111', 'third3333', 'abc123xyz'],
        })
        expect(focusBlock).toHaveBeenCalledWith(
            {'block-uid': 'abc123xyz', 'window-id': 'main-window'},
            {start: 2, end: 4},
        )
    })

    it('does nothing when trying to move the first block up', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockReturnValue('parent123')
        getBlockOrder.mockReturnValue(0)
        getChildBlockUids.mockReturnValue(['abc123xyz', 'second222', 'third3333'])

        const moveBlockUp = BlockManipulationCommands[0] as unknown as () => Promise<void>
        await moveBlockUp()

        expect(reorderBlocks).not.toHaveBeenCalled()
        expect(focusBlock).not.toHaveBeenCalled()
    })

    it('indents the selected block under its previous sibling via the data API', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockReturnValue('parent123')
        getBlockOrder.mockReturnValue(1)
        getChildBlockUids.mockImplementation(parentUid => {
            if (parentUid === 'parent123') return ['first1111', 'abc123xyz', 'third3333']
            if (parentUid === 'first1111') return ['nested-a', 'nested-b']
            return []
        })

        const indentBlock = BlockManipulationCommands[3] as unknown as () => Promise<void>
        await indentBlock()

        expect(setBlockOpen).toHaveBeenCalledWith('first1111', true)
        expect(moveBlock).toHaveBeenCalledWith({
            uid: 'abc123xyz',
            parentUid: 'first1111',
            order: 2,
        })
        expect(mockDelay).toHaveBeenCalledWith(0)
    })

    it('does not indent the first sibling', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockReturnValue('parent123')
        getBlockOrder.mockReturnValue(0)

        const indentBlock = BlockManipulationCommands[3] as unknown as () => Promise<void>
        await indentBlock()

        expect(setBlockOpen).not.toHaveBeenCalled()
        expect(moveBlock).not.toHaveBeenCalled()
    })

    it('outdents the selected block to be the next sibling after its parent', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockImplementation(uid => {
            if (uid === 'abc123xyz') return 'parent123'
            if (uid === 'parent123') return 'grandparent456'
            return null
        })
        getBlockOrder.mockImplementation(uid => (uid === 'parent123' ? 2 : null))

        const outdentBlock = BlockManipulationCommands[4] as unknown as () => Promise<void>
        await outdentBlock()

        expect(moveBlock).toHaveBeenCalledWith({
            uid: 'abc123xyz',
            parentUid: 'grandparent456',
            order: 3,
        })
        expect(mockDelay).toHaveBeenCalledWith(0)
    })

    it('does not outdent top-level blocks', async () => {
        selected.mockReturnValue({id: 'block-abc123xyz'} as unknown as ReturnType<typeof RoamBlock.selected>)
        getParentBlockUid.mockImplementation(uid => (uid === 'abc123xyz' ? 'page-uid' : null))
        getBlockOrder.mockReturnValue(null)

        const outdentBlock = BlockManipulationCommands[4] as unknown as () => Promise<void>
        await outdentBlock()

        expect(moveBlock).not.toHaveBeenCalled()
    })
})
