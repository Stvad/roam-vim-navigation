import {RoamDate} from '../roam/date'
import {Roam} from '../roam/roam'
import {RoamNode, Selection} from '../roam/roam-node'

export const createModifier = (change: number) => (num: number) => num + change

const openBracketsLeftIndex = (text: string, cursor: number): number => text.substring(0, cursor).lastIndexOf('[[')

const closingBracketsLeftIndex = (text: string, cursor: number): number => text.substring(0, cursor).lastIndexOf(']]')

const closingBracketsRightIndex = (text: string, cursor: number): number =>
    cursor + text.substring(cursor).indexOf(']]')

const cursorPlacedBetweenBrackets = (text: string, cursor: number): boolean =>
    openBracketsLeftIndex(text, cursor) < closingBracketsRightIndex(text, cursor) &&
    closingBracketsLeftIndex(text, cursor) < openBracketsLeftIndex(text, cursor)

const cursorPlacedOnNumber = (text: any, cursor: number): boolean =>
    text.substring(0, cursor).match(/[0-9]*$/)[0] + text.substring(cursor).match(/^[0-9]*/)[0] !== ''

const cursorPlacedOnDate = (text: string, cursor: number): boolean =>
    cursorPlacedBetweenBrackets(text, cursor) && nameIsDate(nameInsideBrackets(text, cursor))

const nameInsideBrackets = (text: string, cursor: number): string =>
    text.substring(text.substring(0, cursor).lastIndexOf('[['), cursor + text.substring(cursor).indexOf(']]') + 2)

const nameIsDate = (pageName: string): boolean => pageName.match(RoamDate.regex) !== null

export const modifyDate = (date: Date, modifier: (input: number) => number): Date => {
    const newDate = new Date(date)
    newDate.setDate(modifier(date.getDate()))
    return newDate
}

export const modify = (modifier: (input: number) => number) => {
    const node = Roam.getActiveRoamNode()
    if (!node) return

    const cursor = node.selection.start
    const datesInContent = node.text.match(RoamDate.regex)

    let newValue = node.text

    if (cursorPlacedOnDate(node.text, cursor)) {
        // e.g. Lorem ipsum [[Janu|ary 3rd, 2020]] 123
        newValue =
            node.text.substring(0, openBracketsLeftIndex(node.text, cursor)) +
            RoamDate.formatPage(
                modifyDate(RoamDate.parseFromReference(nameInsideBrackets(node.text, cursor)), modifier)
            ) +
            node.text.substring(closingBracketsRightIndex(node.text, cursor) + 2)
    } else if (cursorPlacedOnNumber(node.text, cursor)) {
        // e.g. Lorem ipsum [[January 3rd, 2020]] 12|3
        const leftMatch = node.text.substring(0, cursor).match(/[0-9]*$/)!
        const rightMatch = node.text.substring(cursor).match(/^[0-9]*/)!
        const left = leftMatch[0]
        const right = rightMatch[0]
        const numberStr = left + right
        const numberStartedAt = leftMatch.index!

        const newNumber = modifier(parseInt(numberStr, 10))
        newValue =
            node.text.substring(0, numberStartedAt) +
            newNumber +
            node.text.substring(numberStartedAt + numberStr.length)
    } else if (datesInContent && datesInContent.length === 1) {
        // e.g. Lor|em ipsum [[January 3rd, 2020]] 123
        newValue = node.text.replace(
            datesInContent[0],
            RoamDate.formatPage(modifyDate(RoamDate.parseFromReference(datesInContent[0]), modifier))
        )
    }
    Roam.save(new RoamNode(newValue, new Selection(cursor, cursor)))
}
