jest.mock('src/core/features/vim-mode/vim', () => ({
    nmap: (_key: string, _label: string, onPress: () => Promise<void> | void) => onPress,
}))

jest.mock('src/core/common/keyboard', () => ({
    Keyboard: {
        pressEnter: jest.fn(),
    },
}))

jest.mock('src/core/features/vim-mode/roam/roam-block', () => ({
    RoamBlock: {
        selected: jest.fn(),
    },
}))

jest.mock('src/core/roam/roam', () => ({
    Roam: {
        activateBlock: jest.fn(),
        createBlockBelow: jest.fn(),
        createSiblingAbove: jest.fn(),
        focusBlockAtEnd: jest.fn(),
        focusBlockAtStart: jest.fn(),
        moveCursorToEnd: jest.fn(),
        moveCursorToStart: jest.fn(),
    },
}))

import {Keyboard} from 'src/core/common/keyboard'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {Roam} from 'src/core/roam/roam'
import {InsertCommands} from 'src/core/features/vim-mode/commands/insert-commands'

describe('Insert commands', () => {
    const selected = RoamBlock.selected as jest.MockedFunction<typeof RoamBlock.selected>
    const pressEnter = Keyboard.pressEnter as jest.MockedFunction<typeof Keyboard.pressEnter>
    const activateBlock = Roam.activateBlock as jest.MockedFunction<typeof Roam.activateBlock>
    const createBlockBelow = Roam.createBlockBelow as jest.MockedFunction<typeof Roam.createBlockBelow>
    const focusBlockAtEnd = Roam.focusBlockAtEnd as jest.MockedFunction<typeof Roam.focusBlockAtEnd>
    const focusBlockAtStart = Roam.focusBlockAtStart as jest.MockedFunction<typeof Roam.focusBlockAtStart>
    const moveCursorToEnd = Roam.moveCursorToEnd as jest.MockedFunction<typeof Roam.moveCursorToEnd>
    const moveCursorToStart = Roam.moveCursorToStart as jest.MockedFunction<typeof Roam.moveCursorToStart>

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('focuses the selected block directly for normal insert mode entry', async () => {
        const target = document.createElement('div')
        target.className = 'roam-block'
        selected.mockReturnValue({element: target} as unknown as ReturnType<typeof RoamBlock.selected>)

        const editBlock = InsertCommands[0] as unknown as () => Promise<void>
        await editBlock()

        expect(focusBlockAtStart).toHaveBeenCalledWith(target)
        expect(activateBlock).not.toHaveBeenCalled()
    })

    it('falls back to native activation for insert mode inside reference sections', async () => {
        document.body.innerHTML = '<div class="rm-reference-item"><div id="block-ref" class="roam-block"></div></div>'
        const target = document.getElementById('block-ref') as HTMLElement
        selected.mockReturnValue({element: target} as unknown as ReturnType<typeof RoamBlock.selected>)

        const editBlock = InsertCommands[0] as unknown as () => Promise<void>
        await editBlock()

        expect(activateBlock).toHaveBeenCalledWith(target)
        expect(moveCursorToStart).toHaveBeenCalledTimes(1)
        expect(focusBlockAtStart).not.toHaveBeenCalled()
    })

    it('falls back to native enter insertion for o inside reference sections', async () => {
        document.body.innerHTML = '<div class="rm-reference-item"><div id="block-ref" class="roam-block"></div></div>'
        const target = document.getElementById('block-ref') as HTMLElement
        selected.mockReturnValue({element: target} as unknown as ReturnType<typeof RoamBlock.selected>)

        const insertBlockAfter = InsertCommands[4] as unknown as () => Promise<void>
        await insertBlockAfter()

        expect(activateBlock).toHaveBeenCalledWith(target)
        expect(moveCursorToEnd).toHaveBeenCalledTimes(1)
        expect(pressEnter).toHaveBeenCalledTimes(1)
        expect(createBlockBelow).not.toHaveBeenCalled()
    })

    it('uses API-backed create-below outside reference sections', async () => {
        const target = document.createElement('div')
        target.className = 'roam-block'
        selected.mockReturnValue({element: target} as unknown as ReturnType<typeof RoamBlock.selected>)

        const insertBlockAfter = InsertCommands[4] as unknown as () => Promise<void>
        await insertBlockAfter()

        expect(createBlockBelow).toHaveBeenCalledWith(target)
        expect(activateBlock).not.toHaveBeenCalled()
        expect(pressEnter).not.toHaveBeenCalled()
    })

    it('focuses the selected block directly at the end for a outside reference sections', async () => {
        const target = document.createElement('div')
        target.className = 'roam-block'
        selected.mockReturnValue({element: target} as unknown as ReturnType<typeof RoamBlock.selected>)

        const editBlockFromEnd = InsertCommands[1] as unknown as () => Promise<void>
        await editBlockFromEnd()

        expect(focusBlockAtEnd).toHaveBeenCalledWith(target)
        expect(activateBlock).not.toHaveBeenCalled()
    })
})
