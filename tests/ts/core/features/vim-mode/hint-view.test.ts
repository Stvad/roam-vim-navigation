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

const parsePx = (value: string) => Number.parseFloat(value)

describe('Vim hint view', () => {
    beforeEach(() => {
        document.head.innerHTML = ''
        document.body.innerHTML = ''
        jest.resetModules()
    })

    it('renders hint badges as overlays inside the selected block', async () => {
        const {updateVimHints, clearVimHints, resetHintKeyProvider} =
            await import('src/core/features/vim-mode/hint-view')
        document.body.innerHTML = `
            <div id="block">
                <span class="rm-page-ref">[[Page]]</span>
            </div>
        `

        const block = document.getElementById('block') as HTMLElement
        const link = block.querySelector('.rm-page-ref') as HTMLElement

        Object.defineProperty(block, 'getBoundingClientRect', {
            value: () => createRect(100, 200, 500, 260),
        })
        Object.defineProperty(link, 'getBoundingClientRect', {
            value: () => createRect(120, 220, 220, 240),
        })
        Object.defineProperty(link, 'getClientRects', {
            value: () => [createRect(120, 220, 220, 240)] as unknown as DOMRectList,
        })

        await resetHintKeyProvider()
        updateVimHints(block)

        const overlay = block.querySelector('.roam-toolkit--hint-overlay.roam-toolkit--hint-overlay0') as HTMLElement
        const overlayLeft = parsePx(overlay.style.left)
        const overlayTop = parsePx(overlay.style.top)
        const targetRight = 220 - 100
        const targetBottom = 240 - 200
        expect(link.classList.contains('roam-toolkit--hint')).toBe(true)
        expect(link.classList.contains('roam-toolkit--hint0')).toBe(true)
        expect(block.classList.contains('roam-toolkit--hint-host')).toBe(true)
        expect(overlay).not.toBeNull()
        expect(overlayLeft).toBeGreaterThanOrEqual(targetRight - 6)
        expect(overlayLeft).toBeLessThanOrEqual(targetRight + 6)
        expect(overlayTop).toBeGreaterThanOrEqual(targetBottom - 6)
        expect(overlayTop).toBeLessThanOrEqual(targetBottom + 6)

        const style = document.getElementById('roam-toolkit-block-mode--hint')
        expect(style?.innerHTML).toContain('.roam-toolkit--hint-host {')
        expect(style?.innerHTML).toContain('.roam-toolkit--hint-overlay {')
        expect(style?.innerHTML).toContain('position: absolute;')
        expect(style?.innerHTML).toContain('pointer-events: none;')
        expect(style?.innerHTML).toContain('white-space: nowrap;')

        clearVimHints()
        expect(link.classList.contains('roam-toolkit--hint')).toBe(false)
        expect(link.classList.contains('roam-toolkit--hint0')).toBe(false)
        expect(block.classList.contains('roam-toolkit--hint-host')).toBe(false)
        expect(block.querySelector('.roam-toolkit--hint-overlay')).toBeNull()
    })

    it('positions multiline link hints from the last rendered line', async () => {
        const {updateVimHints, resetHintKeyProvider} = await import('src/core/features/vim-mode/hint-view')
        document.body.innerHTML = `
            <div id="block">
                <a class="external-link">https://example.com/a-really-long-url</a>
            </div>
        `

        const block = document.getElementById('block') as HTMLElement
        const link = block.querySelector('a') as HTMLElement

        Object.defineProperty(block, 'getBoundingClientRect', {
            value: () => createRect(100, 200, 600, 360),
        })
        Object.defineProperty(link, 'getBoundingClientRect', {
            value: () => createRect(120, 220, 420, 280),
        })
        Object.defineProperty(link, 'getClientRects', {
            value: () => [createRect(120, 220, 360, 240), createRect(120, 240, 420, 260)] as unknown as DOMRectList,
        })

        await resetHintKeyProvider()
        updateVimHints(block)

        const overlay = block.querySelector('.roam-toolkit--hint-overlay.roam-toolkit--hint-overlay0') as HTMLElement
        const overlayLeft = parsePx(overlay.style.left)
        const overlayTop = parsePx(overlay.style.top)
        const firstLineRight = 360 - 100
        const lastLineRight = 420 - 100
        const firstLineBottom = 240 - 200
        const lastLineBottom = 260 - 200

        expect(Math.abs(overlayLeft - lastLineRight)).toBeLessThan(Math.abs(overlayLeft - firstLineRight))
        expect(Math.abs(overlayTop - lastLineBottom)).toBeLessThan(Math.abs(overlayTop - firstLineBottom))
    })
})
