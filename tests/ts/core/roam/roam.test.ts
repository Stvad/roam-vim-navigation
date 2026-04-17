jest.mock('src/core/common/dom', () => ({
    getActiveEditElement: jest.fn(() => null),
    getFirstTopLevelBlock: jest.fn(),
    getInputEvent: jest.fn(() => new Event('input', {bubbles: true})),
    getLastTopLevelBlock: jest.fn(),
}))

jest.mock('src/core/common/keyboard', () => ({
    Keyboard: {
        pressBackspace: jest.fn(),
        pressEnter: jest.fn(),
        pressEsc: jest.fn(),
        pressTab: jest.fn(),
        simulateKey: jest.fn(),
    },
}))

jest.mock('src/core/common/mouse', () => ({
    Mouse: {
        hover: jest.fn(),
        leftClick: jest.fn(),
    },
}))

jest.mock('src/core/roam/roam-db', () => ({
    RoamDb: {
        createBlock: jest.fn(),
        deleteBlock: jest.fn(),
        focusBlock: jest.fn(),
        getBlockByUid: jest.fn(),
        getBlockLocationForElement: jest.fn(),
        getBlockOrder: jest.fn(),
        getChildBlockUids: jest.fn(),
        getFocusedBlock: jest.fn(),
        getPageByName: jest.fn(),
        getParentBlockUid: jest.fn(),
        getWindowIdForElement: jest.fn(),
        setBlockOpen: jest.fn(),
    },
}))

import {RoamDb} from 'src/core/roam/roam-db'
import {Roam} from 'src/core/roam/roam'

describe('Roam block creation helpers', () => {
    const createBlock = RoamDb.createBlock as jest.MockedFunction<typeof RoamDb.createBlock>
    const focusBlock = RoamDb.focusBlock as jest.MockedFunction<typeof RoamDb.focusBlock>
    const getBlockByUid = RoamDb.getBlockByUid as jest.MockedFunction<typeof RoamDb.getBlockByUid>
    const getBlockLocationForElement = RoamDb.getBlockLocationForElement as jest.MockedFunction<
        typeof RoamDb.getBlockLocationForElement
    >
    const getBlockOrder = RoamDb.getBlockOrder as jest.MockedFunction<typeof RoamDb.getBlockOrder>
    const getChildBlockUids = RoamDb.getChildBlockUids as jest.MockedFunction<typeof RoamDb.getChildBlockUids>
    const getFocusedBlock = RoamDb.getFocusedBlock as jest.MockedFunction<typeof RoamDb.getFocusedBlock>
    const getPageByName = RoamDb.getPageByName as jest.MockedFunction<typeof RoamDb.getPageByName>
    const getParentBlockUid = RoamDb.getParentBlockUid as jest.MockedFunction<typeof RoamDb.getParentBlockUid>
    const setBlockOpen = RoamDb.setBlockOpen as jest.MockedFunction<typeof RoamDb.setBlockOpen>
    const getWindowIdForElement = RoamDb.getWindowIdForElement as jest.MockedFunction<
        typeof RoamDb.getWindowIdForElement
    >
    const generateUID = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        createBlock.mockResolvedValue(undefined)
        setBlockOpen.mockResolvedValue(undefined)
        generateUID.mockReturnValue('new-block')
        getBlockByUid.mockReturnValue({':block/string': ''})
        getBlockLocationForElement.mockReturnValue(null)
        getPageByName.mockReturnValue({':block/uid': 'page-uid'})
        getWindowIdForElement.mockReturnValue('main-window')
        window.roamAlphaAPI = {
            util: {
                generateUID,
            },
        } as unknown as typeof window.roamAlphaAPI
    })

    it('creates a sibling below when the current block has no children', async () => {
        getFocusedBlock.mockReturnValue({'block-uid': 'current-block', 'window-id': 'main-window'})
        getChildBlockUids.mockReturnValue([])
        getParentBlockUid.mockReturnValue('parent-block')
        getBlockOrder.mockReturnValue(2)

        await Roam.createBlockBelow()

        expect(setBlockOpen).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'parent-block', order: 3},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('creates the first child block when the current block already has children', async () => {
        getFocusedBlock.mockReturnValue({'block-uid': 'current-block', 'window-id': 'sidebar-window'})
        getChildBlockUids.mockReturnValue(['child-a'])

        await Roam.createBlockBelow()

        expect(setBlockOpen).toHaveBeenCalledWith('current-block', true)
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'current-block', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'sidebar-window'}, {start: 0})
        expect(getParentBlockUid).not.toHaveBeenCalled()
    })

    it('keeps createSiblingBelow as a true sibling insertion', async () => {
        getFocusedBlock.mockReturnValue({'block-uid': 'current-block', 'window-id': 'main-window'})
        getParentBlockUid.mockReturnValue('parent-block')
        getBlockOrder.mockReturnValue(1)

        await Roam.createSiblingBelow()

        expect(setBlockOpen).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'parent-block', order: 2},
            block: {uid: 'new-block', string: ''},
        })
    })

    it('can create below a selected block without reusing the currently focused block', async () => {
        const target = document.createElement('div')
        target.id = 'block-def456uvw'

        getFocusedBlock.mockReturnValue({'block-uid': 'otherblock', 'window-id': 'sidebar-window'})
        getBlockLocationForElement.mockReturnValue({'block-uid': 'def456uvw', 'window-id': 'main-window'})
        getChildBlockUids.mockReturnValue([])
        getParentBlockUid.mockReturnValue('parent-block')
        getBlockOrder.mockReturnValue(0)

        await Roam.createBlockBelow(target)

        expect(getBlockLocationForElement).toHaveBeenCalledWith(target)
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'parent-block', order: 1},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('focuses a selected block at the start without clicking it first', () => {
        const target = document.createElement('div')
        target.id = 'block-def456uvw'

        getBlockLocationForElement.mockReturnValue({'block-uid': 'def456uvw', 'window-id': 'sidebar-window'})

        Roam.focusBlockAtStart(target)

        expect(getBlockLocationForElement).toHaveBeenCalledWith(target)
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'def456uvw', 'window-id': 'sidebar-window'}, {start: 0})
    })

    it('focuses a selected block at the end using its current text length', () => {
        const target = document.createElement('div')
        target.id = 'block-def456uvw'

        getBlockLocationForElement.mockReturnValue({'block-uid': 'def456uvw', 'window-id': 'main-window'})
        getBlockByUid.mockReturnValue({':block/string': 'hello'})

        Roam.focusBlockAtEnd(target)

        expect(getBlockByUid).toHaveBeenCalledWith('def456uvw')
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'def456uvw', 'window-id': 'main-window'}, {start: 5})
    })

    it('creates the first real block through the data API when entering insert mode on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)

        Roam.focusBlockAtStart(target)
        await Promise.resolve()

        expect(getPageByName).toHaveBeenCalledWith('Empty Page')
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('creates the first real block for append mode on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)

        Roam.focusBlockAtEnd(target)
        await Promise.resolve()

        expect(getBlockByUid).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('creates the first real block for block insertion commands on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)

        await Roam.createBlockBelow(target)
        await Roam.createSiblingAbove(target)

        expect(createBlock).toHaveBeenCalledTimes(2)
        expect(createBlock).toHaveBeenNthCalledWith(1, {
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(createBlock).toHaveBeenNthCalledWith(2, {
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(getParentBlockUid).not.toHaveBeenCalled()
    })
})
