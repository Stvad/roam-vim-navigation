import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {PANEL_CSS_CLASS} from 'src/core/roam/panel/roam-panel-utils'

type Rect = {
    top: number
    height: number
    width: number
}

describe('VimRoamPanel visible block selection', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('selects the first block that intersects the viewport, even when clipped at the top', () => {
        const {panel} = createPanelWithBlocks([
            {id: 'block-top', top: 90, height: 30, width: 100},
            {id: 'block-middle', top: 150, height: 30, width: 100},
            {id: 'block-bottom', top: 360, height: 60, width: 100},
        ])

        panel.selectFirstVisibleBlock()

        expect(panel.selectedBlockId).toBe('block-top')
    })

    it('selects the last block that intersects the viewport, even when clipped at the bottom', () => {
        const {panel} = createPanelWithBlocks([
            {id: 'block-top', top: 90, height: 30, width: 100},
            {id: 'block-middle', top: 150, height: 30, width: 100},
            {id: 'block-bottom', top: 360, height: 60, width: 100},
        ])

        panel.selectLastVisibleBlock()

        expect(panel.selectedBlockId).toBe('block-bottom')
    })

    it('keeps padded visibility checks for scroll-into-view behavior', () => {
        const {panel, panelElement, blocks} = createPanelWithBlocks([
            {id: 'block-top', top: 90, height: 30, width: 100},
            {id: 'block-middle', top: 150, height: 30, width: 100},
        ])

        panel.scrollUntilBlockIsVisible(blocks[0])

        expect(panelElement.scrollTop).toBe(-60)
    })

    it('can re-scroll the selected block after layout updates settle', async () => {
        const {panel, blocks} = createPanelWithBlocks([
            {id: 'block-top', top: 90, height: 30, width: 100},
            {id: 'block-middle', top: 150, height: 30, width: 100},
        ])
        const scrollUntilBlockIsVisible = jest.spyOn(panel, 'scrollUntilBlockIsVisible')

        panel.selectBlock(blocks[0].id)
        scrollUntilBlockIsVisible.mockClear()

        await panel.selectBlockAfterLayout()

        expect(scrollUntilBlockIsVisible).toHaveBeenCalledWith(blocks[0])
    })
})

const createPanelWithBlocks = (blockRects: ({id: string} & Rect)[]) => {
    const panelElement = document.createElement('div')
    panelElement.className = PANEL_CSS_CLASS
    panelElement.scrollTop = 0
    setRect(panelElement, {top: 100, height: 300, width: 300})

    const blocks = blockRects.map(({id, ...rect}) => {
        const block = document.createElement('div')
        block.className = 'roam-block'
        block.id = id
        setRect(block, rect)
        panelElement.append(block)
        return block
    })

    document.body.append(panelElement)

    return {
        panel: new VimRoamPanel(panelElement),
        panelElement,
        blocks,
    }
}

const setRect = (element: HTMLElement, rect: Rect) => {
    Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            bottom: rect.top + rect.height,
            height: rect.height,
            left: 0,
            right: rect.width,
            toJSON: () => ({}),
            top: rect.top,
            width: rect.width,
            x: 0,
            y: rect.top,
        }),
    })

    Object.defineProperty(element, 'offsetWidth', {
        configurable: true,
        value: rect.width,
    })
}
