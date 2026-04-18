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

const hintCss = async (n: number) => {
    const key = await hintKeyProvider(n)
    return `
        .${hintCssClass(n)}::after {
            content: "[${key}]";
        }
    `
}

const injectHintStyles = async () => {
    const cssClasses = await Promise.all(HINT_IDS.map(hintCss))
    injectStyle(
        cssClasses.join('\n') +
            `
        .${HINT_CSS_CLASS} {
            position: relative;
        }
        .${HINT_CSS_CLASS}::after {
            position: absolute;
            top: 100%;
            left: 100%;
            margin-left: 2px;
            transform: translateY(-65%);
            display: block;
            font-size: 10px;
            line-height: 1;
            font-style: italic;
            font-weight: bold;
            color: darkorchid;
            text-shadow: 1px 1px 0px orange;
            opacity: 0.7;
            pointer-events: none;
            white-space: nowrap;
            z-index: 1;
        }
        .check-container.${HINT_CSS_CLASS}::after {
            top: 50%;
            left: 50%;
            margin-left: 0;
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
        link.classList.add(HINT_CSS_CLASS, hintCssClass(i))
    })
}

export const clearVimHints = () => {
    const priorHints = document.querySelectorAll(`.${HINT_CSS_CLASS}`)
    priorHints.forEach(selection => selection.classList.remove(HINT_CSS_CLASS, ...HINT_CSS_CLASSES))
}

export const getHint = (n: number): HTMLElement | null => document.querySelector(`.${hintCssClass(n)}`)
