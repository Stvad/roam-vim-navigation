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

import {getActiveEditElement} from 'src/core/common/dom'
import {nmap} from 'src/core/features/vim-mode/vim'
import {updateVimView} from 'src/core/features/vim-mode/vim-view'

describe('Vim mode shortcuts', () => {
    const mockGetActiveEditElement = getActiveEditElement as jest.MockedFunction<typeof getActiveEditElement>
    const mockUpdateVimView = updateVimView as jest.MockedFunction<typeof updateVimView>

    beforeEach(() => {
        jest.clearAllMocks()
        document.body.innerHTML = ''
        mockGetActiveEditElement.mockReturnValue(null)
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
})
