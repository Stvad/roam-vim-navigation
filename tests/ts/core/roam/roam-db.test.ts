import {RoamDb} from 'src/core/roam/roam-db'

describe('RoamDb', () => {
    const q = jest.fn()
    const pull = jest.fn()
    const undo = jest.fn()
    const redo = jest.fn()
    const create = jest.fn()
    const update = jest.fn()
    const move = jest.fn()
    const remove = jest.fn()
    const reorderBlocks = jest.fn()
    const getFocusedBlock = jest.fn()
    const getWindows = jest.fn()
    const setBlockFocusAndSelection = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

        window.roamAlphaAPI = {
            data: {
                q,
                pull,
                undo,
                redo,
                block: {
                    create,
                    update,
                    move,
                    delete: remove,
                    reorderBlocks,
                },
            },
            ui: {
                getFocusedBlock,
                setBlockFocusAndSelection,
                mainWindow: {
                    focusFirstBlock: jest.fn(),
                    openBlock: jest.fn(),
                    openPage: jest.fn(),
                },
                rightSidebar: {
                    getWindows,
                    addWindow: jest.fn(),
                },
            },
            util: {
                generateUID: jest.fn(),
            },
        }
    })

    it('pulls a block by uid via the data API', () => {
        pull.mockReturnValue({':block/string': 'Hello'})

        const block = RoamDb.getBlockByUid('abc123xyz')

        expect(block).toEqual({':block/string': 'Hello'})
        expect(pull).toHaveBeenCalledWith('[*]', [':block/uid', 'abc123xyz'])
    })

    it('wraps block mutation methods with the current data.block API', async () => {
        await RoamDb.updateBlockText('abc123xyz', 'Updated')
        await RoamDb.createBlock({
            location: {parentUid: 'parent123', order: 'last'},
            block: {uid: 'new123uid', string: ''},
        })
        await RoamDb.moveBlock({uid: 'abc123xyz', parentUid: 'parent123', order: 2})
        await RoamDb.deleteBlock('abc123xyz')

        expect(update).toHaveBeenCalledWith({block: {uid: 'abc123xyz', string: 'Updated'}})
        expect(create).toHaveBeenCalledWith({
            location: {'parent-uid': 'parent123', order: 'last'},
            block: {uid: 'new123uid', string: ''},
        })
        expect(move).toHaveBeenCalledWith({
            location: {'parent-uid': 'parent123', order: 2},
            block: {uid: 'abc123xyz'},
        })
        expect(remove).toHaveBeenCalledWith({block: {uid: 'abc123xyz'}})
    })

    it('focuses blocks using the current UI focus API', () => {
        const location = {'block-uid': 'abc123xyz', 'window-id': 'main-window'}

        getFocusedBlock.mockReturnValue(location)

        expect(RoamDb.getFocusedBlock()).toEqual(location)
        expect(RoamDb.getFocusedBlockUid()).toEqual('abc123xyz')

        RoamDb.focusBlock(location, {start: 1, end: 3})
        expect(setBlockFocusAndSelection).toHaveBeenCalledWith({
            location,
            selection: {start: 1, end: 3},
        })
    })

    it('resolves block locations in the main window without entering edit mode first', () => {
        document.body.innerHTML = '<div class="roam-article"><div id="block-abc123xyz" class="roam-block"></div></div>'
        getFocusedBlock.mockReturnValue({'block-uid': 'other0001', 'window-id': 'sidebar-window'})

        const location = RoamDb.getBlockLocationForElement(document.getElementById('block-abc123xyz') as HTMLElement)

        expect(location).toEqual({'block-uid': 'abc123xyz', 'window-id': 'main-window'})
    })

    it('resolves block locations in sidebar windows from the sidebar window list', () => {
        document.body.innerHTML = `
            <div class="sidebar-content">
                <div><div id="panel-one"><div id="block-abc123xyz" class="roam-block"></div></div></div>
                <div><div id="panel-two"><div id="block-def456uvw" class="roam-block"></div></div></div>
            </div>
        `
        getWindows.mockReturnValue([{'window-id': 'window-one'}, {'window-id': 'window-two'}])

        const location = RoamDb.getBlockLocationForElement(document.getElementById('block-def456uvw') as HTMLElement)

        expect(location).toEqual({'block-uid': 'def456uvw', 'window-id': 'window-two'})
    })

    it('uses direct Roam undo and redo APIs', async () => {
        await RoamDb.undo()
        await RoamDb.redo()

        expect(undo).toHaveBeenCalledTimes(1)
        expect(redo).toHaveBeenCalledTimes(1)
    })

    it('sorts child blocks by order when reading siblings', () => {
        q.mockReturnValue([
            ['child-b', 1],
            ['child-a', 0],
            ['child-c', 2],
        ])

        expect(RoamDb.getChildBlockUids('parent123')).toEqual(['child-a', 'child-b', 'child-c'])
    })
})
