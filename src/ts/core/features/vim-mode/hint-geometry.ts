const rectHasArea = (rect: DOMRect) => rect.width > 0 || rect.height > 0

export const getVisibleClientRects = (element: Element): DOMRect[] =>
    Array.from(element.getClientRects()).filter(rectHasArea)

export const getFirstClientRect = (element: Element): DOMRect | null => getVisibleClientRects(element)[0] ?? null

export const getLastClientRect = (element: Element): DOMRect | null => getVisibleClientRects(element).at(-1) ?? null

const intersectsViewport = (rect: DOMRect) =>
    rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth

export const isElementVisibleInViewport = (element: Element): boolean => {
    const rects = getVisibleClientRects(element)
    if (rects.length) {
        return rects.some(intersectsViewport)
    }

    return intersectsViewport(element.getBoundingClientRect())
}
