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
                    getWindows: jest.fn(),
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
