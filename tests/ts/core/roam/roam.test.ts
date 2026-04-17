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
        getPanelWindowIdForElement: jest.fn(),
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
    const getPanelWindowIdForElement = RoamDb.getPanelWindowIdForElement as jest.MockedFunction<
        typeof RoamDb.getPanelWindowIdForElement
    >
    const getPageByName = RoamDb.getPageByName as jest.MockedFunction<typeof RoamDb.getPageByName>
    const getParentBlockUid = RoamDb.getParentBlockUid as jest.MockedFunction<typeof RoamDb.getParentBlockUid>
    const setBlockOpen = RoamDb.setBlockOpen as jest.MockedFunction<typeof RoamDb.setBlockOpen>
    const generateUID = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        createBlock.mockResolvedValue(undefined)
        setBlockOpen.mockResolvedValue(undefined)
        generateUID.mockReturnValue('new-block')
        getBlockByUid.mockReturnValue({':block/string': ''})
        getBlockOrder.mockReturnValue(0)
        getChildBlockUids.mockReturnValue([])
        getBlockLocationForElement.mockReturnValue(null)
        getPanelWindowIdForElement.mockReturnValue('main-window')
        getPageByName.mockReturnValue({':block/uid': 'page-uid'})
        getParentBlockUid.mockReturnValue('page-uid')
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

    it('focuses a selected block at the start without clicking it first', async () => {
        const target = document.createElement('div')
        target.id = 'block-def456uvw'

        getBlockLocationForElement.mockReturnValue({'block-uid': 'def456uvw', 'window-id': 'sidebar-window'})

        await Roam.focusBlockAtStart(target)

        expect(getBlockLocationForElement).toHaveBeenCalledWith(target)
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'def456uvw', 'window-id': 'sidebar-window'}, {start: 0})
    })

    it('focuses a selected block at the end using its current text length', async () => {
        const target = document.createElement('div')
        target.id = 'block-def456uvw'

        getBlockLocationForElement.mockReturnValue({'block-uid': 'def456uvw', 'window-id': 'main-window'})
        getBlockByUid.mockReturnValue({':block/string': 'hello'})

        await Roam.focusBlockAtEnd(target)

        expect(getBlockByUid).toHaveBeenCalledWith('def456uvw')
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'def456uvw', 'window-id': 'main-window'}, {start: 5})
    })

    it('creates the first real block through the data API when entering insert mode on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)

        await Roam.focusBlockAtStart(target)

        expect(getPageByName).toHaveBeenCalledWith('Empty Page')
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('prefers the page uid from the title display container for ghost blocks on page views', async () => {
        getPageByName.mockReturnValue(null)
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display-container" data-page-uid="04-17-2026"><div class="rm-title-display"><span>April 17th, 2026</span></div></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)

        await Roam.focusBlockAtStart(target)

        expect(getPageByName).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: '04-17-2026', order: 0},
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

        await Roam.focusBlockAtEnd(target)

        expect(getBlockByUid).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })

    it('backfills the ghost block before creating a sibling below on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)
        generateUID.mockReturnValueOnce('materialized-block').mockReturnValueOnce('inserted-below')

        await Roam.createBlockBelow(target)

        expect(createBlock).toHaveBeenCalledTimes(2)
        expect(createBlock).toHaveBeenNthCalledWith(1, {
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'materialized-block', string: ''},
        })
        expect(createBlock).toHaveBeenNthCalledWith(2, {
            location: {parentUid: 'page-uid', order: 1},
            block: {uid: 'inserted-below', string: ''},
        })
        expect(getParentBlockUid).toHaveBeenCalledWith('materialized-block')
        expect(focusBlock).toHaveBeenNthCalledWith(
            1,
            {'block-uid': 'materialized-block', 'window-id': 'main-window'},
            {start: 0},
        )
        expect(focusBlock).toHaveBeenNthCalledWith(
            2,
            {'block-uid': 'inserted-below', 'window-id': 'main-window'},
            {start: 0},
        )
    })

    it('backfills the ghost block before creating a sibling above on an empty page', async () => {
        document.body.innerHTML =
            '<div class="roam-article"><div class="rm-title-display"><span>Empty Page</span></div></div>'
        const target = document.createElement('div')
        target.id = 'block-input-ghost'
        ;(document.querySelector('.roam-article') as HTMLElement).appendChild(target)
        generateUID.mockReturnValueOnce('materialized-block').mockReturnValueOnce('inserted-above')

        await Roam.createSiblingAbove(target)

        expect(createBlock).toHaveBeenCalledTimes(2)
        expect(createBlock).toHaveBeenNthCalledWith(1, {
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'materialized-block', string: ''},
        })
        expect(createBlock).toHaveBeenNthCalledWith(2, {
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'inserted-above', string: ''},
        })
        expect(getParentBlockUid).toHaveBeenCalledWith('materialized-block')
        expect(focusBlock).toHaveBeenNthCalledWith(
            1,
            {'block-uid': 'materialized-block', 'window-id': 'main-window'},
            {start: 0},
        )
        expect(focusBlock).toHaveBeenNthCalledWith(
            2,
            {'block-uid': 'inserted-above', 'window-id': 'main-window'},
            {start: 0},
        )
    })

    it('creates the first real block in the matching sidebar window for an empty sidebar page', async () => {
        document.body.innerHTML = `
            <div class="sidebar-content">
                <div>
                    <div>
                        <div class="window-headers">
                            <div class="rm-title-display-container" data-page-uid="sidebar-page-uid">
                                <div class="rm-title-display"><span>Sidebar Page</span></div>
                            </div>
                        </div>
                        <div id="block-input-ghost"></div>
                    </div>
                </div>
            </div>
        `
        const target = document.getElementById('block-input-ghost') as HTMLElement
        getPanelWindowIdForElement.mockReturnValue('sidebar-window')

        await Roam.focusBlockAtStart(target)

        expect(getPageByName).not.toHaveBeenCalled()
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'sidebar-page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'sidebar-window'}, {start: 0})
    })

    it('creates the first real block on an empty daily note page using the daily note title', async () => {
        document.body.innerHTML = `
            <div class="roam-article">
                <div id="rm-log-container">
                    <div class="roam-log-preview">
                        <h1><a>April 17th, 2026</a></h1>
                    </div>
                    <div id="block-input-ghost"></div>
                </div>
            </div>
        `
        const target = document.getElementById('block-input-ghost') as HTMLElement

        await Roam.focusBlockAtStart(target)

        expect(getPageByName).toHaveBeenCalledWith('April 17th, 2026')
        expect(createBlock).toHaveBeenCalledWith({
            location: {parentUid: 'page-uid', order: 0},
            block: {uid: 'new-block', string: ''},
        })
        expect(focusBlock).toHaveBeenCalledWith({'block-uid': 'new-block', 'window-id': 'main-window'}, {start: 0})
    })
})
