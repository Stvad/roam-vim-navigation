jest.mock('src/core/common/dom', () => ({
    getActiveEditElement: jest.fn(),
}))

jest.mock('src/core/common/mouse', () => ({
    Mouse: {
        leftClick: jest.fn().mockResolvedValue(undefined),
    },
}))

jest.mock('src/core/roam/roam', () => ({
    Roam: {
        focusBlockAtStart: jest.fn().mockResolvedValue(undefined),
    },
}))

jest.mock('src/core/roam/panel/roam-panel', () => ({
    RoamPanel: {
        tagPanels: jest.fn(),
    },
}))

jest.mock('src/core/features/vim-mode/roam/roam-vim-panel', () => ({
    VimRoamPanel: {
        fromBlock: jest.fn(),
        selected: jest.fn(),
    },
}))

jest.mock('src/core/features/vim-mode/vim', () => ({
    returnToNormalMode: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('src/core/features/vim-mode/vim-view', () => ({
    updateVimView: jest.fn(),
}))

import {getActiveEditElement} from 'src/core/common/dom'
import {Mouse} from 'src/core/common/mouse'
import {Roam} from 'src/core/roam/roam'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {returnToNormalMode} from 'src/core/features/vim-mode/vim'
import {updateVimView} from 'src/core/features/vim-mode/vim-view'
import {
    collectPageHintTargets,
    generatePageHintLabels,
    resetPageHintAlphabet,
    startPageHintSession,
    stopPageHintSession,
} from 'src/core/features/vim-mode/page-hint-view'

const createRect = (left: number, top: number, right: number, bottom: number): DOMRect =>
    ({
        bottom,
        height: bottom - top,
        left,
        right,
        toJSON: () => ({}),
        top,
        width: right - left,
        x: left,
        y: top,
    }) as DOMRect

const defineRects = (element: Element, rect: DOMRect, rects: DOMRect[] = [rect]) => {
    Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: () => rect,
    })
    Object.defineProperty(element, 'getClientRects', {
        configurable: true,
        value: () => rects as unknown as DOMRectList,
    })
}

const flushAsyncWork = async () => {
    await Promise.resolve()
    await Promise.resolve()
}

describe('Page hint view', () => {
    const mockGetActiveEditElement = getActiveEditElement as jest.MockedFunction<typeof getActiveEditElement>
    const mockLeftClick = Mouse.leftClick as jest.MockedFunction<typeof Mouse.leftClick>
    const mockFocusBlockAtStart = Roam.focusBlockAtStart as jest.MockedFunction<typeof Roam.focusBlockAtStart>
    const mockFromBlock = VimRoamPanel.fromBlock as jest.MockedFunction<typeof VimRoamPanel.fromBlock>
    const mockSelectedPanel = VimRoamPanel.selected as jest.MockedFunction<typeof VimRoamPanel.selected>
    const mockReturnToNormalMode = returnToNormalMode as jest.MockedFunction<typeof returnToNormalMode>
    const mockUpdateVimView = updateVimView as jest.MockedFunction<typeof updateVimView>

    beforeEach(() => {
        jest.clearAllMocks()
        document.head.innerHTML = ''
        document.body.innerHTML = ''
        mockGetActiveEditElement.mockReturnValue(null)
        stopPageHintSession()
        resetPageHintAlphabet()
    })

    afterEach(() => {
        stopPageHintSession()
    })

    it('switches to fixed-length prefix-free labels after exhausting the alphabet', () => {
        expect(generatePageHintLabels(3, ['a', 's', 'd'])).toEqual(['a', 's', 'd'])
        expect(generatePageHintLabels(4, ['a', 's', 'd'])).toEqual(['aa', 'sa', 'da', 'as'])
    })

    it('prefers home row-only sequences before using non-home-row characters', () => {
        expect(generatePageHintLabels(5, ['a', 's', 'd', 'q'], ['a', 's', 'd'])).toEqual(['aa', 'sa', 'da', 'as', 'ss'])
    })

    it('prioritizes blocks and links in the selected panel before other panels', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
                <a id="link-main">Main link</a>
            </div>
            <div id="panel-side" class="roam-toolkit--panel">
                <div id="block-side" class="roam-block">Sidebar block</div>
                <a id="link-side">Sidebar link</a>
            </div>
        `

        const blockMain = document.getElementById('block-main') as HTMLElement
        const linkMain = document.getElementById('link-main') as HTMLElement
        const blockSide = document.getElementById('block-side') as HTMLElement
        const linkSide = document.getElementById('link-side') as HTMLElement

        defineRects(blockMain, createRect(120, 120, 320, 150))
        defineRects(linkMain, createRect(180, 120, 240, 135))
        defineRects(blockSide, createRect(520, 120, 720, 150))
        defineRects(linkSide, createRect(580, 120, 650, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: blockSide}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        const targets = collectPageHintTargets()

        expect(targets.map(target => target.element.id)).toEqual(['block-side', 'link-side', 'block-main', 'link-main'])
        expect(targets.map(target => target.hint)).toEqual(['a', 's', 'd', 'f'])
    })

    it('can scope visible targets down to blocks only', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
                <a id="link-main">Main link</a>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        const link = document.getElementById('link-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))
        defineRects(link, createRect(180, 120, 240, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: block}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        const targets = collectPageHintTargets('blocks')

        expect(targets.map(target => target.element.id)).toEqual(['block-main'])
    })

    it('can scope visible targets down to links only', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
                <a id="link-main">Main link</a>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        const link = document.getElementById('link-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))
        defineRects(link, createRect(180, 120, 240, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: link}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        const targets = collectPageHintTargets('links')

        expect(targets.map(target => target.element.id)).toEqual(['link-main'])
    })

    it('treats attribute references as link targets in page hint mode', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
                <span id="attr-main" tabindex="-1" class="rm-attr-ref" data-link-uid="leyqQmtku">repeat interval:</span>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        const attributeReference = document.getElementById('attr-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))
        defineRects(attributeReference, createRect(180, 120, 280, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: block}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        const targets = collectPageHintTargets('links')

        expect(targets.map(target => target.element.id)).toEqual(['attr-main'])
    })

    it('selects a hinted block in normal mode', async () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))

        const panelController = {
            select: jest.fn(),
            selectBlock: jest.fn(),
        }

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: block}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)
        mockFromBlock.mockReturnValue(panelController as unknown as ReturnType<typeof VimRoamPanel.fromBlock>)

        expect(startPageHintSession('normal')).toBe(true)
        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}))
        await flushAsyncWork()

        expect(panelController.select).toHaveBeenCalledTimes(1)
        expect(panelController.selectBlock).toHaveBeenCalledWith('block-main')
        expect(mockReturnToNormalMode).not.toHaveBeenCalled()
        expect(mockUpdateVimView).toHaveBeenCalled()
        expect(document.querySelector('.roam-toolkit--page-hint-root')).toBeNull()
    })

    it('focuses the hinted block directly for insert mode entry', async () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: block}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        expect(startPageHintSession('insert', 'blocks')).toBe(true)
        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}))
        await flushAsyncWork()

        expect(mockFocusBlockAtStart).toHaveBeenCalledWith(block)
        expect(mockUpdateVimView).toHaveBeenCalled()
    })

    it('does not render link hints in insert hint mode', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <div id="block-main" class="roam-block">Main block</div>
                <a id="link-main">Main link</a>
            </div>
        `

        const block = document.getElementById('block-main') as HTMLElement
        const link = document.getElementById('link-main') as HTMLElement
        defineRects(block, createRect(120, 120, 320, 150))
        defineRects(link, createRect(180, 120, 240, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: block}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        expect(startPageHintSession('insert', 'blocks')).toBe(true)

        expect(document.querySelectorAll('.roam-toolkit--page-hint--block')).toHaveLength(1)
        expect(document.querySelectorAll('.roam-toolkit--page-hint--link')).toHaveLength(0)
    })

    it('opens hinted links in the sidebar when the final key is shifted', async () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <a id="link-main">Main link</a>
            </div>
        `

        const link = document.getElementById('link-main') as HTMLElement
        defineRects(link, createRect(180, 120, 240, 135))

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: link}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        expect(startPageHintSession('normal')).toBe(true)
        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'A', shiftKey: true}))
        await flushAsyncWork()

        expect(mockLeftClick).toHaveBeenCalledWith(link, {shiftKey: true})
        expect(mockUpdateVimView).toHaveBeenCalled()
    })

    it('positions link hints from the bottom right of the last rendered line', () => {
        document.body.innerHTML = `
            <div id="panel-main" class="roam-toolkit--panel">
                <a id="link-main">Main link</a>
            </div>
        `

        const link = document.getElementById('link-main') as HTMLElement
        defineRects(link, createRect(180, 120, 420, 160), [
            createRect(180, 120, 360, 140),
            createRect(180, 140, 420, 160),
        ])

        mockSelectedPanel.mockReturnValue({
            selectedBlock: () => ({element: link}),
        } as unknown as ReturnType<typeof VimRoamPanel.selected>)

        expect(startPageHintSession('normal')).toBe(true)

        const overlay = document.querySelector('.roam-toolkit--page-hint--link') as HTMLElement

        expect(Number.parseFloat(overlay.style.left)).toBe(420)
        expect(Number.parseFloat(overlay.style.top)).toBe(159)
    })
})
