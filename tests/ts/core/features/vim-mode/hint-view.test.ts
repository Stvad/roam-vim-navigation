describe('Vim hint view', () => {
    beforeEach(async () => {
        document.head.innerHTML = ''
        document.body.innerHTML = ''
        jest.resetModules()
    })

    it('injects hint styles that keep hint badges out of normal layout flow', async () => {
        const {updateVimHints, clearVimHints, resetHintKeyProvider} =
            await import('src/core/features/vim-mode/hint-view')
        document.body.innerHTML = `
            <div id="block">
                <span class="rm-page-ref">[[Page]]</span>
            </div>
        `

        const block = document.getElementById('block') as HTMLElement
        const link = block.querySelector('.rm-page-ref') as HTMLElement

        await resetHintKeyProvider()
        updateVimHints(block)

        expect(link.classList.contains('roam-toolkit--hint')).toBe(true)
        expect(link.classList.contains('roam-toolkit--hint0')).toBe(true)

        const style = document.getElementById('roam-toolkit-block-mode--hint')
        expect(style?.innerHTML).toContain('.roam-toolkit--hint {')
        expect(style?.innerHTML).toContain('position: relative;')
        expect(style?.innerHTML).toContain('.roam-toolkit--hint::after {')
        expect(style?.innerHTML).toContain('position: absolute;')
        expect(style?.innerHTML).toContain('pointer-events: none;')
        expect(style?.innerHTML).toContain('white-space: nowrap;')

        clearVimHints()
        expect(link.classList.contains('roam-toolkit--hint')).toBe(false)
        expect(link.classList.contains('roam-toolkit--hint0')).toBe(false)
    })
})
