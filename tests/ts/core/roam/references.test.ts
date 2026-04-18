jest.mock('src/core/common/mouse', () => ({
    Mouse: {
        leftClick: jest.fn(() => Promise.resolve()),
    },
}))

jest.mock('src/core/common/dom', () => ({
    getActiveEditElement: jest.fn(() => null),
}))

jest.mock('src/core/features/vim-mode/roam/roam-block', () => ({
    RoamBlock: {
        selected: jest.fn(),
    },
}))

jest.mock('src/core/features/vim-mode/roam/roam-vim-panel', () => ({
    VimRoamPanel: {
        fromBlock: jest.fn(),
    },
}))

jest.mock('src/core/roam/roam', () => ({
    Roam: {
        focusBlockSelection: jest.fn(),
    },
}))

import {getActiveEditElement} from 'src/core/common/dom'
import {Mouse} from 'src/core/common/mouse'
import {RoamBlock} from 'src/core/features/vim-mode/roam/roam-block'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {Roam} from 'src/core/roam/roam'
import {expandLastBreadcrumb} from 'src/core/roam/references'

describe('Reference breadcrumb expansion', () => {
    const selected = RoamBlock.selected as jest.MockedFunction<typeof RoamBlock.selected>
    const getEditElement = getActiveEditElement as jest.MockedFunction<typeof getActiveEditElement>
    const leftClick = Mouse.leftClick as jest.MockedFunction<typeof Mouse.leftClick>
    const fromBlock = VimRoamPanel.fromBlock as jest.MockedFunction<typeof VimRoamPanel.fromBlock>
    const focusBlockSelection = Roam.focusBlockSelection as jest.MockedFunction<typeof Roam.focusBlockSelection>
    const scrollUntilBlockIsVisible = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        document.body.innerHTML = ''
        fromBlock.mockReturnValue({scrollUntilBlockIsVisible} as unknown as ReturnType<typeof VimRoamPanel.fromBlock>)
    })

    it('reselects the current block after expanding a page-reference breadcrumb', async () => {
        const block = renderReferenceBlock()
        selected.mockReturnValue({element: block, id: block.id} as unknown as ReturnType<typeof RoamBlock.selected>)

        await expandLastBreadcrumb()

        expect(leftClick).toHaveBeenCalledTimes(1)
        expect(fromBlock).toHaveBeenCalledWith(block)
        expect(scrollUntilBlockIsVisible).toHaveBeenCalledWith(block)
        expect(focusBlockSelection).not.toHaveBeenCalled()
    })

    it('restores editor focus for the selected block after expanding a breadcrumb', async () => {
        const block = renderReferenceBlock()
        const textarea = document.createElement('textarea')
        textarea.className = 'rm-block-input'
        textarea.id = block.id
        textarea.value = 'hello'
        block.append(textarea)
        textarea.setSelectionRange(2, 4)

        selected.mockReturnValue({element: block, id: block.id} as unknown as ReturnType<typeof RoamBlock.selected>)
        getEditElement.mockReturnValue(textarea)

        await expandLastBreadcrumb()

        expect(scrollUntilBlockIsVisible).not.toHaveBeenCalled()
        expect(focusBlockSelection).toHaveBeenCalledWith(block, {start: 2, end: 4})
    })

    it('falls back to inline-reference breadcrumbs without clicking twice', async () => {
        const block = renderInlineReferenceBlock()
        selected.mockReturnValue({element: block, id: block.id} as unknown as ReturnType<typeof RoamBlock.selected>)

        await expandLastBreadcrumb()

        expect(leftClick).toHaveBeenCalledTimes(1)
        expect(scrollUntilBlockIsVisible).toHaveBeenCalledWith(block)
    })

    it('does not require a standard panel for custom rendered inline references', async () => {
        const block = renderInlineReferenceBlockWithoutPanel()
        selected.mockReturnValue({element: block, id: block.id} as unknown as ReturnType<typeof RoamBlock.selected>)

        await expect(expandLastBreadcrumb()).resolves.toBeUndefined()

        expect(leftClick).toHaveBeenCalledTimes(1)
        expect(fromBlock).not.toHaveBeenCalled()
    })
})

const renderReferenceBlock = () => {
    document.body.innerHTML = `
        <div class="roam-toolkit--panel">
            <div class="rm-reference-item">
                <div id="block-ref" class="roam-block">
                    <div class="zoom-mentions-view">
                        <button id="crumb-1"></button>
                        <button id="crumb-2"></button>
                    </div>
                </div>
            </div>
        </div>
    `

    return document.getElementById('block-ref') as HTMLElement
}

const renderInlineReferenceBlock = () => {
    document.body.innerHTML = `
        <div class="roam-toolkit--panel">
            <div class="rm-inline-reference">
                <div id="block-inline" class="roam-block">
                    <div class="rm-zoom-path">
                        <span class="rm-zoom-item-content">one</span>
                        <span class="rm-zoom-item-content">two</span>
                    </div>
                </div>
            </div>
        </div>
    `

    return document.getElementById('block-inline') as HTMLElement
}

const renderInlineReferenceBlockWithoutPanel = () => {
    document.body.innerHTML = `
        <div class="rm-inline-reference">
            <div id="block-inline-custom" class="roam-block">
                <div class="rm-zoom-path">
                    <span class="rm-zoom-item-content">one</span>
                    <span class="rm-zoom-item-content">two</span>
                </div>
            </div>
        </div>
    `

    return document.getElementById('block-inline-custom') as HTMLElement
}
