import {getBlockUid} from 'src/core/roam/block'

import {RoamNode, Selection} from './roam-node'
import {getActiveEditElement, getFirstTopLevelBlock, getInputEvent, getLastTopLevelBlock} from '../common/dom'
import {Keyboard} from '../common/keyboard'
import {Mouse} from '../common/mouse'
import {delay} from 'src/core/common/async'
import {RoamBlockLocation, RoamDb} from './roam-db'
import {Selectors} from './selectors'

function setValueOnReactInput(element: HTMLTextAreaElement, value: string) {
    const getSetter = (target: any) => Object.getOwnPropertyDescriptor(target, 'value')?.set
    // roamElement.value = roamNode.text
    // Simulating input on React is fun
    // https://hustle.bizongo.in/simulate-react-on-change-on-controlled-components-baa336920e04
    const setter = getSetter(element)
    // setter?.call(element, value);

    const prototypeSetter = getSetter(Object.getPrototypeOf(element))

    if (setter !== prototypeSetter) {
        prototypeSetter!.call(element, value)
    } else {
        setter!.call(element, value)
    }

    element.dispatchEvent(getInputEvent())
}

const selectionParams = (selection: Selection) =>
    selection.start === selection.end ? {start: selection.start} : {start: selection.start, end: selection.end}

const focusedBlockLocation = (): RoamBlockLocation | null => RoamDb.getFocusedBlock()
const blockLocation = (targetBlock?: HTMLElement): RoamBlockLocation | null =>
    targetBlock ? RoamDb.getBlockLocationForElement(targetBlock) : focusedBlockLocation()
const isGhostBlock = (block?: HTMLElement): block is HTMLElement => block?.id === 'block-input-ghost'
const blockText = (block: HTMLElement): string => RoamDb.getBlockByUid(getBlockUid(block.id))?.[':block/string'] || ''
const blockHasText = (block: HTMLElement): boolean => Boolean(blockText(block))
const textContent = (element: Element | null): string | null => {
    const text = element?.textContent?.trim()
    return text ? text : null
}

const dailyNotesTitleForGhostBlock = (block: HTMLElement): string | null => {
    const dailyNotesPage = (block.closest(Selectors.dailyNotesPage) ||
        block.closest(Selectors.dailyNotes)) as HTMLElement | null
    if (!dailyNotesPage) {
        return null
    }

    return (
        textContent(dailyNotesPage.querySelector('.roam-log-preview h1 a')) ||
        textContent(dailyNotesPage.querySelector('.roam-log-preview h1')) ||
        textContent(dailyNotesPage.querySelector('.rm-title-display > span'))
    )
}

const currentMainPageUid = (): string | null => {
    const pageRouteMatch = window.location.hash.match(/\/page\/([^/?#]+)/)
    if (!pageRouteMatch) {
        return null
    }

    const [, pageUid] = pageRouteMatch
    return pageUid ? decodeURIComponent(pageUid) : null
}

const pageTitleForGhostBlock = (block: HTMLElement): string | null => {
    const sidebarPage = block.closest(Selectors.sidebarPage) as HTMLElement | null
    const sidebarHeaderLink = sidebarPage?.querySelector('.window-headers div > a') as HTMLElement | null
    if (sidebarHeaderLink?.textContent) {
        return sidebarHeaderLink.textContent.trim()
    }

    const dailyNotesTitle = dailyNotesTitleForGhostBlock(block)
    if (dailyNotesTitle) {
        return dailyNotesTitle
    }

    const page = (block.closest(Selectors.mainContent) || sidebarPage) as HTMLElement | null
    const pageTitle = page?.querySelector('.rm-title-display > span') as HTMLElement | null
    return textContent(pageTitle)
}

const focusSelection = (selection: Selection) => {
    const focusedBlock = focusedBlockLocation()
    if (!focusedBlock || selection.start < 0) {
        return
    }

    RoamDb.focusBlock(focusedBlock, selectionParams(selection))
}

const createEmptyBlock = async (parentUid: string, order: number | 'last') => {
    const newUid = window.roamAlphaAPI.util.generateUID()
    await RoamDb.createBlock({
        location: {parentUid, order},
        block: {uid: newUid, string: ''},
    })
    return newUid
}

const focusCreatedBlock = (windowId: string, uid: string, selection: {start: number; end?: number} = {start: 0}) => {
    RoamDb.focusBlock({'block-uid': uid, 'window-id': windowId}, selection)
}

const createAndFocusEmptyBlock = async (
    windowId: string,
    parentUid: string,
    order: number | 'last',
    selection: {start: number; end?: number} = {start: 0},
) => {
    const newUid = await createEmptyBlock(parentUid, order)
    focusCreatedBlock(windowId, newUid, selection)
    return newUid
}

const createEmptyChildBlock = async (location: RoamBlockLocation, parentUid: string, order: 0 | 'last' = 'last') => {
    await RoamDb.setBlockOpen(parentUid, true)
    return createAndFocusEmptyBlock(location['window-id'], parentUid, order)
}

const ghostBlockContext = (targetBlock: HTMLElement) => {
    const pageTitle = pageTitleForGhostBlock(targetBlock)
    const windowId = RoamDb.getPanelWindowIdForElement(targetBlock)
    const parentUid =
        (windowId === 'main-window' ? currentMainPageUid() : null) ||
        (pageTitle ? RoamDb.getPageByName(pageTitle)?.[':block/uid'] : null)
    if (!parentUid || !windowId) {
        return null
    }

    return {parentUid, windowId}
}

const materializeGhostBlock = async (
    targetBlock: HTMLElement,
    selection?: {start: number; end?: number},
): Promise<RoamBlockLocation | null> => {
    const context = ghostBlockContext(targetBlock)
    if (!context) {
        return null
    }

    const newUid = await createEmptyBlock(context.parentUid, 0)
    if (selection) {
        focusCreatedBlock(context.windowId, newUid, selection)
    }

    return {'block-uid': newUid, 'window-id': context.windowId}
}

const resolveBlockLocation = async (
    targetBlock?: HTMLElement,
    ghostSelection?: {start: number; end?: number},
): Promise<RoamBlockLocation | null> => {
    if (targetBlock && isGhostBlock(targetBlock)) {
        return materializeGhostBlock(targetBlock, ghostSelection)
    }

    return blockLocation(targetBlock)
}

export const Roam = {
    async save(roamNode: RoamNode): Promise<void> {
        const roamElement = this.getRoamBlockInput()

        if (roamElement) {
            console.log(`Saving`, roamNode)
            setValueOnReactInput(roamElement, roamNode.text)

            // Need to select afterwards, otherwise the input event resets the cursor
            await delay(1)
            roamElement.setSelectionRange(roamNode.selection.start, roamNode.selection.end)
        }
    },

    getRoamBlockInput(): HTMLTextAreaElement | null {
        const element = getActiveEditElement()
        if (element?.tagName.toLocaleLowerCase() !== 'textarea') {
            return null
        }
        return element as HTMLTextAreaElement
    },

    getActiveRoamNode(): RoamNode | null {
        const element = this.getRoamBlockInput()
        if (!element) return null

        return new RoamNode(element.value, new Selection(element.selectionStart, element.selectionEnd))
    },

    async applyToCurrent(action: (node: RoamNode) => RoamNode) {
        const node = this.getActiveRoamNode()
        if (!node) return

        await this.save(action(node))
    },

    async highlight(element?: HTMLElement) {
        if (element) {
            await this.activateBlock(element)
        }
        if (this.getRoamBlockInput()) {
            return Keyboard.pressEsc()
        } else {
            return Promise.reject("We're not inside a block")
        }
    },

    async activateBlock(element: HTMLElement) {
        if (element.classList.contains('roam-block')) {
            await Mouse.leftClick(element)
        }
        return this.getRoamBlockInput()
    },

    async deleteBlock() {
        const focusedBlock = focusedBlockLocation()
        if (focusedBlock) {
            return RoamDb.deleteBlock(focusedBlock['block-uid'])
        }

        await this.highlight()
        const highlightedBlock = focusedBlockLocation()
        if (!highlightedBlock) {
            return
        }

        return RoamDb.deleteBlock(highlightedBlock['block-uid'])
    },

    async copyBlock() {
        await this.highlight()
        document.execCommand('copy')
    },

    async duplicateBlock() {
        await this.copyBlock()
        await Keyboard.pressEnter()
        await Keyboard.pressEnter()
        document.execCommand('paste')
    },

    async moveCursorToStart() {
        const node = this.getActiveRoamNode()
        if (!node) return

        focusSelection(node.withCursorAtTheStart().selection)
    },

    async moveCursorToEnd() {
        const node = this.getActiveRoamNode()
        if (!node) return

        focusSelection(node.withCursorAtTheEnd().selection)
    },

    async moveCursorToSearchTerm(searchTerm: string) {
        const node = this.getActiveRoamNode()
        if (!node) return

        const updatedNode = node.withCursorAtSearchTerm(searchTerm)
        if (updatedNode.selection.start < 0) {
            return
        }

        focusSelection(updatedNode.selection)
    },

    async focusBlockSelection(targetBlock: HTMLElement, selection?: {start: number; end?: number}) {
        const location = await resolveBlockLocation(targetBlock)
        if (!location) return

        RoamDb.focusBlock(location, selection)
    },

    async focusBlockAtStart(targetBlock: HTMLElement) {
        await this.focusBlockSelection(targetBlock, {start: 0})
    },

    async focusBlockAtEnd(targetBlock: HTMLElement) {
        const selection = isGhostBlock(targetBlock) ? {start: 0} : {start: blockText(targetBlock).length}
        await this.focusBlockSelection(targetBlock, selection)
    },

    writeText(text: string) {
        this.applyToCurrent(node => new RoamNode(text, node.selection))
        return this.getActiveRoamNode()?.text === text
    },

    appendText(text: string) {
        const existingText = this.getActiveRoamNode()?.text || ''
        return this.writeText(existingText + text)
    },

    async createSiblingAbove(targetBlock?: HTMLElement) {
        const focusedBlock = await resolveBlockLocation(targetBlock, {start: 0})
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createAndFocusEmptyBlock(focusedBlock['window-id'], parentUid, order)
    },

    async createBlockBelow(targetBlock?: HTMLElement) {
        const focusedBlock = await resolveBlockLocation(targetBlock, {start: 0})
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        if (RoamDb.getChildBlockUids(currentUid).length > 0) {
            await createEmptyChildBlock(focusedBlock, currentUid, 0)
            return
        }

        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createAndFocusEmptyBlock(focusedBlock['window-id'], parentUid, order + 1)
    },

    async createSiblingBelow(targetBlock?: HTMLElement) {
        const focusedBlock = blockLocation(targetBlock)
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createAndFocusEmptyBlock(focusedBlock['window-id'], parentUid, order + 1)
    },

    async createFirstChild() {
        const focusedBlock = focusedBlockLocation()
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        await createEmptyChildBlock(focusedBlock, currentUid, 0)
    },

    async createLastChild() {
        const focusedBlock = focusedBlockLocation()
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        await createEmptyChildBlock(focusedBlock, currentUid)
    },

    async createDeepestLastDescendant() {
        await this.highlight()
        await Keyboard.simulateKey(Keyboard.RIGHT_ARROW)
        await Keyboard.pressEnter()
    },

    async createBlockAtTop(forceCreation: boolean = false) {
        const firstBlock = getFirstTopLevelBlock()
        if (blockHasText(firstBlock) || forceCreation) {
            await this.createSiblingAbove(firstBlock)
        }
    },

    async createBlockAtBottom(forceCreation: boolean = false) {
        const lastBlock = getLastTopLevelBlock()
        if (blockHasText(lastBlock) || forceCreation) {
            await this.createSiblingBelow(lastBlock)
        }
    },

    async toggleFoldBlock(block: HTMLElement) {
        const uid = getBlockUid(block.id)
        const isOpen = RoamDb.getBlockByUid(uid)?.[':block/open'] !== false
        await RoamDb.setBlockOpen(uid, !isOpen)
    },
}
