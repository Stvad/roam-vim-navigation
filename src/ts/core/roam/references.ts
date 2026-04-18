import {Selectors} from './selectors'
import {Mouse} from '../common/mouse'
import {BlockElement, RoamBlock} from '../features/vim-mode/roam/roam-block'
import {getActiveEditElement} from '../common/dom'
import {delay} from '../common/async'
import {VimRoamPanel} from '../features/vim-mode/roam/roam-vim-panel'
import {Roam} from './roam'
import {PANEL_SELECTOR} from './panel/roam-panel-utils'

type BlockSelection = {
    start: number
    end: number
}

async function expandReference(
    wrapperSelector: string,
    breadcrumbSelector: string,
    getClickElement: (parent: HTMLElement) => HTMLElement | null,
) {
    const referenceItem = RoamBlock.selected().element?.closest(wrapperSelector + ',' + Selectors.inlineReference)
    const breadcrumbs = referenceItem?.querySelector(breadcrumbSelector + ',' + Selectors.zoomPath)
    if (!breadcrumbs) return false

    const clickElement = getClickElement(breadcrumbs as HTMLElement)
    if (!clickElement) return false

    await Mouse.leftClick(clickElement)
    return true
}

const activeSelection = (selectedBlockId: string): BlockSelection | null => {
    const editElement = getActiveEditElement()
    if (!editElement || !('selectionStart' in editElement)) {
        return null
    }

    const activeBlockId = editElement.closest(`${Selectors.block}, ${Selectors.blockInput}`)?.id
    if (activeBlockId !== selectedBlockId) {
        return null
    }

    const start = editElement.selectionStart ?? 0
    return {
        start,
        end: editElement.selectionEnd ?? start,
    }
}

const restoreSelectedBlock = async (selectedBlockId: string, selection: BlockSelection | null) => {
    const selectedBlock = document.getElementById(selectedBlockId) as BlockElement | null
    if (!selectedBlock) {
        return
    }

    if (selection) {
        await Roam.focusBlockSelection(selectedBlock, selection)
        return
    }

    if (!selectedBlock.closest(PANEL_SELECTOR)) {
        return
    }

    VimRoamPanel.fromBlock(selectedBlock).scrollUntilBlockIsVisible(selectedBlock)
}

export const expandLastBreadcrumb = async () => {
    const selectedBlockId = RoamBlock.selected().id
    const selection = activeSelection(selectedBlockId)

    const expanded =
        (await expandReference(
            Selectors.referenceItem,
            Selectors.breadcrumbsContainer,
            breadcrumbs => breadcrumbs.lastElementChild as HTMLElement,
        )) ||
        (await expandReference(Selectors.inlineReference, Selectors.zoomPath, breadcrumbs => {
            const nodes = breadcrumbs.querySelectorAll(Selectors.zoomItemContent)
            return nodes[nodes.length - 1] as HTMLElement
        }))

    if (expanded) {
        await delay(0)
        await restoreSelectedBlock(selectedBlockId, selection)
    }
}

export const closePageReferenceView = () => {
    const referenceItem = RoamBlock.selected().element?.closest(
        Selectors.pageReferenceItem + ',' + Selectors.inlineReference,
    )
    const foldButton = referenceItem?.querySelector(Selectors.foldButton)

    if (foldButton) Mouse.leftClick(foldButton as HTMLElement)
}

const parentPageLink = (blockElement: BlockElement | null): HTMLElement | null => {
    const referenceCard = blockElement?.closest(Selectors.pageReferenceItem)
    if (referenceCard) {
        return referenceCard?.querySelector(Selectors.pageReferenceLink) as HTMLElement
    }

    const panel = blockElement?.closest(`${Selectors.mainContent}, ${Selectors.sidebarPage}`)
    if (panel) {
        return panel.querySelector(Selectors.title) as HTMLElement
    }

    return null
}

export const openParentPage = (shiftKey: boolean = false) => {
    const parentLink = parentPageLink(RoamBlock.selected().element)
    if (!parentLink) {
        return
    }

    Mouse.leftClick(parentLink, {shiftKey})
}

const getMentionsButton = (blockElement: BlockElement | null): HTMLElement | null => {
    const blockMentionsButton = blockElement
        ?.closest(Selectors.blockBulletView)
        ?.querySelector('.block-ref-count-button')
    if (blockMentionsButton) {
        return blockMentionsButton as HTMLElement
    }

    const sidePanel = blockElement?.closest(Selectors.sidebarPage)
    return sidePanel?.querySelector('button.bp3-button') as HTMLElement
}

export const openMentions = (shiftKey: boolean = false) => {
    const mentionsButton = getMentionsButton(RoamBlock.selected().element)
    if (mentionsButton) {
        Mouse.leftClick(mentionsButton, {shiftKey})
    }
}
