import {injectStyle} from 'src/core/common/css'
import {Selectors} from 'src/core/roam/selectors'

export const HINT_IDS = [0, 1, 2, 3, 4, 5, 6]
export const DEFAULT_HINT_KEYS = ['q', 'w', 'e', 'r', 't', 'f', 'b']

type HintKeyProvider = (n: number) => Promise<string>

const defaultHintKeyProvider: HintKeyProvider = async n => DEFAULT_HINT_KEYS[n]
let hintKeyProvider: HintKeyProvider = defaultHintKeyProvider

const HINT_CSS_CLASS = 'roam-toolkit--hint'
const hintCssClass = (n: number) => HINT_CSS_CLASS + n
const HINT_CSS_CLASSES = HINT_IDS.map(hintCssClass)
const HINT_HOST_CSS_CLASS = 'roam-toolkit--hint-host'
const HINT_OVERLAY_CSS_CLASS = 'roam-toolkit--hint-overlay'
const HINT_OVERLAY_CENTERED_CSS_CLASS = `${HINT_OVERLAY_CSS_CLASS}--centered`
const hintOverlayCssClass = (n: number) => HINT_OVERLAY_CSS_CLASS + n

const HINT_OVERLAY_X_OFFSET = 0
const HINT_OVERLAY_Y_OFFSET = -1

const hintCss = async (n: number) => {
    const key = await hintKeyProvider(n)
    return `
        .${hintOverlayCssClass(n)}::after {
            content: "[${key}]";
        }
    `
}

const injectHintStyles = async () => {
    const cssClasses = await Promise.all(HINT_IDS.map(hintCss))
    injectStyle(
        cssClasses.join('\n') +
            `
        .${HINT_HOST_CSS_CLASS} {
            position: relative;
        }
        .${HINT_OVERLAY_CSS_CLASS} {
            position: absolute;
            pointer-events: none;
            z-index: 1;
        }
        .${HINT_OVERLAY_CSS_CLASS}::after {
            display: block;
            font-size: 10px;
            line-height: 1;
            font-style: italic;
            font-weight: bold;
            color: darkorchid;
            text-shadow: 1px 1px 0px orange;
            opacity: 0.7;
            white-space: nowrap;
        }
        .${HINT_OVERLAY_CENTERED_CSS_CLASS} {
            transform: translate(-50%, -50%);
        }
        `,
        'roam-toolkit-block-mode--hint',
    )
}

void injectHintStyles()

export const setHintKeyProvider = async (provider: HintKeyProvider) => {
    hintKeyProvider = provider
    await injectHintStyles()
}

export const resetHintKeyProvider = async () => {
    await setHintKeyProvider(defaultHintKeyProvider)
}

export const updateVimHints = (block: HTMLElement) => {
    block.classList.add(HINT_HOST_CSS_CLASS)

    // button is for reference counts
    const clickableSelectors = [
        Selectors.link,
        Selectors.externalLink,
        Selectors.checkbox,
        Selectors.button,
        Selectors.blockReference,
        Selectors.hiddenSection,
    ]
    const links = block.querySelectorAll(clickableSelectors.join(', '))

    links.forEach((link, i) => {
        if (i >= HINT_IDS.length) {
            return
        }

        link.classList.add(HINT_CSS_CLASS, hintCssClass(i))
        block.appendChild(createHintOverlay(link, block, i))
    })
}

export const clearVimHints = () => {
    const priorHints = document.querySelectorAll(`.${HINT_CSS_CLASS}`)
    priorHints.forEach(selection => selection.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES))
    document.querySelectorAll(`.${HINT_HOST_CSS_CLASS}`).forEach(block => block.classList.remove(HINT_HOST_CSS_CLASS))
    document.querySelectorAll(`.${HINT_OVERLAY_CSS_CLASS}`).forEach(overlay => overlay.remove())
}

export const getHint = (n: number): HTMLElement | null => document.querySelector(`.${hintCssClass(n)}`)

const createHintOverlay = (hintTarget: Element, block: HTMLElement, hintId: number) => {
    const overlay = document.createElement('span')
    overlay.classList.add(HINT_OVERLAY_CSS_CLASS, hintOverlayCssClass(hintId))
    overlay.setAttribute('aria-hidden', 'true')

    const blockRect = block.getBoundingClientRect()
    const {left, top, centered} = getHintOverlayPosition(hintTarget, blockRect)

    overlay.style.left = `${left}px`
    overlay.style.top = `${top}px`

    if (centered) {
        overlay.classList.add(HINT_OVERLAY_CENTERED_CSS_CLASS)
    }

    return overlay
}

const getHintOverlayPosition = (hintTarget: Element, blockRect: DOMRect) => {
    if (hintTarget.matches(Selectors.checkbox)) {
        const rect = hintTarget.getBoundingClientRect()
        return {
            centered: true,
            left: rect.left - blockRect.left + rect.width / 2,
            top: rect.top - blockRect.top + rect.height / 2,
        }
    }

    const rect = getLastClientRect(hintTarget) ?? hintTarget.getBoundingClientRect()
    return {
        centered: false,
        left: rect.right - blockRect.left + HINT_OVERLAY_X_OFFSET,
        top: rect.bottom - blockRect.top + HINT_OVERLAY_Y_OFFSET,
    }
}

const getLastClientRect = (hintTarget: Element): DOMRect | null => {
    const visibleRects = Array.from(hintTarget.getClientRects()).filter(rect => rect.width > 0 || rect.height > 0)
    return visibleRects.at(-1) ?? null
}
