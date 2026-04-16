import {getBlockUid} from 'src/core/roam/block'

import {RoamNode, Selection} from './roam-node'
import {getActiveEditElement, getFirstTopLevelBlock, getInputEvent, getLastTopLevelBlock} from '../common/dom'
import {Keyboard} from '../common/keyboard'
import {Mouse} from '../common/mouse'
import {delay} from 'src/core/common/async'
import {RoamBlockLocation, RoamDb} from './roam-db'

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

const focusSelection = (selection: Selection) => {
    const focusedBlock = focusedBlockLocation()
    if (!focusedBlock || selection.start < 0) {
        return
    }

    RoamDb.focusBlock(focusedBlock, selectionParams(selection))
}

const createEmptyBlockAt = async (location: RoamBlockLocation, parentUid: string, order: number | 'last') => {
    const newUid = window.roamAlphaAPI.util.generateUID()
    await RoamDb.createBlock({
        location: {parentUid, order},
        block: {uid: newUid, string: ''},
    })
    RoamDb.focusBlock({...location, 'block-uid': newUid}, {start: 0})
    return newUid
}

const createEmptyChildBlock = async (location: RoamBlockLocation, parentUid: string, order: 0 | 'last' = 'last') => {
    await RoamDb.setBlockOpen(parentUid, true)
    return createEmptyBlockAt(location, parentUid, order)
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

    writeText(text: string) {
        this.applyToCurrent(node => new RoamNode(text, node.selection))
        return this.getActiveRoamNode()?.text === text
    },

    appendText(text: string) {
        const existingText = this.getActiveRoamNode()?.text || ''
        return this.writeText(existingText + text)
    },

    async createSiblingAbove() {
        const focusedBlock = focusedBlockLocation()
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createEmptyBlockAt(focusedBlock, parentUid, order)
    },

    async createBlockBelow() {
        const focusedBlock = focusedBlockLocation()
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        if (RoamDb.getChildBlockUids(currentUid).length > 0) {
            await createEmptyChildBlock(focusedBlock, currentUid, 0)
            return
        }

        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createEmptyBlockAt(focusedBlock, parentUid, order + 1)
    },

    async createSiblingBelow() {
        const focusedBlock = focusedBlockLocation()
        if (!focusedBlock) return

        const currentUid = focusedBlock['block-uid']
        const parentUid = RoamDb.getParentBlockUid(currentUid)
        const order = RoamDb.getBlockOrder(currentUid)
        if (!parentUid || order === null) return

        await createEmptyBlockAt(focusedBlock, parentUid, order + 1)
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
        await this.activateBlock(getFirstTopLevelBlock())
        if (this.getActiveRoamNode()?.text || forceCreation) {
            await this.createSiblingAbove()
        }
    },

    async createBlockAtBottom(forceCreation: boolean = false) {
        await this.activateBlock(getLastTopLevelBlock())
        if (this.getActiveRoamNode()?.text || forceCreation) {
            await this.createSiblingBelow()
        }
    },

    async toggleFoldBlock(block: HTMLElement) {
        const uid = getBlockUid(block.id)
        const isOpen = RoamDb.getBlockByUid(uid)?.[':block/open'] !== false
        await RoamDb.setBlockOpen(uid, !isOpen)
    },
}
