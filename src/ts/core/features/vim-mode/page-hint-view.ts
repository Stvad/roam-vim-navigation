import {injectStyle} from 'src/core/common/css'
import {getActiveEditElement} from 'src/core/common/dom'
import {Mouse} from 'src/core/common/mouse'
import {Roam} from 'src/core/roam/roam'
import {RoamPanel} from 'src/core/roam/panel/roam-panel'
import {PANEL_SELECTOR} from 'src/core/roam/panel/roam-panel-utils'
import {Selectors} from 'src/core/roam/selectors'
import {VimRoamPanel} from 'src/core/features/vim-mode/roam/roam-vim-panel'
import {returnToNormalMode} from 'src/core/features/vim-mode/vim'
import {updateVimView} from 'src/core/features/vim-mode/vim-view'

import {getFirstClientRect, isElementVisibleInViewport} from './hint-geometry'
import {setPageHintSessionActive} from './page-hint-state'

export const PAGE_HINT_ALPHABETS = {
    colemak: [
        'a',
        'r',
        's',
        't',
        'd',
        'h',
        'n',
        'e',
        'i',
        'o',
        'q',
        'w',
        'f',
        'p',
        'g',
        'j',
        'l',
        'u',
        'y',
        'z',
        'x',
        'c',
        'v',
        'b',
        'k',
        'm',
    ],
    qwerty: [
        'a',
        's',
        'd',
        'f',
        'g',
        'h',
        'j',
        'k',
        'l',
        'q',
        'w',
        'e',
        'r',
        't',
        'y',
        'u',
        'i',
        'o',
        'p',
        'z',
        'x',
        'c',
        'v',
        'b',
        'n',
        'm',
    ],
} as const

export const PAGE_HINT_HOME_ROW_ALPHABETS = {
    colemak: ['a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o'],
    qwerty: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
} as const

type PageHintSelectionMode = 'insert' | 'normal'
type PageHintTargetScope = 'all' | 'blocks' | 'links'
type PageHintTargetType = 'block' | 'link'

type PageHintTarget = {
    element: HTMLElement
    elementId?: string
    hint: string
    order: number
    panelIndex: number
    priorityTier: number
    type: PageHintTargetType
}

type ActivePageHintSession = {
    isResolving: boolean
    keydownHandler: (event: KeyboardEvent) => void
    mode: PageHintSelectionMode
    prefix: string
    renderHandler: () => void
    scope: PageHintTargetScope
    targets: PageHintTarget[]
}

const PAGE_HINT_STYLE_ID = 'roam-toolkit-block-mode--page-hint'
const PAGE_HINT_BODY_CLASS = 'roam-toolkit--page-hinting'
const PAGE_HINT_ROOT_CLASS = 'roam-toolkit--page-hint-root'
const PAGE_HINT_CLASS = 'roam-toolkit--page-hint'
const PAGE_HINT_BLOCK_CLASS = `${PAGE_HINT_CLASS}--block`
const PAGE_HINT_LINK_CLASS = `${PAGE_HINT_CLASS}--link`
const PAGE_HINT_CENTERED_CLASS = `${PAGE_HINT_CLASS}--centered`
const BLOCK_TARGET_SELECTOR = `${Selectors.block}, ${Selectors.blockInput}`
const LINK_TARGET_SELECTOR = [
    Selectors.link,
    Selectors.attributeReference,
    Selectors.multibar,
    Selectors.blockReference,
    Selectors.externalLink,
].join(', ')
const BLOCK_HINT_X_OFFSET = -10
const LINK_HINT_X_OFFSET = 0
const LINK_HINT_Y_OFFSET = -1

let pageHintAlphabet: string[] = [...PAGE_HINT_ALPHABETS.qwerty]
let pageHintHomeRowAlphabet: string[] = [...PAGE_HINT_HOME_ROW_ALPHABETS.qwerty]
let activeSession: ActivePageHintSession | null = null

const injectPageHintStyles = () => {
    injectStyle(
        `
        body.${PAGE_HINT_BODY_CLASS} .roam-toolkit--hint-overlay {
            display: none;
        }
        .${PAGE_HINT_ROOT_CLASS} {
            inset: 0;
            pointer-events: none;
            position: fixed;
            z-index: 2147483647;
        }
        .${PAGE_HINT_CLASS} {
            align-items: center;
            background: #fff3c4;
            border: 1px solid #c76f1a;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            color: #6c2a00;
            display: inline-flex;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            left: 0;
            letter-spacing: 0.06em;
            line-height: 1;
            padding: 2px 4px;
            position: fixed;
            text-transform: uppercase;
            top: 0;
            white-space: nowrap;
        }
        .${PAGE_HINT_BLOCK_CLASS} {
            transform: translate(-100%, -35%);
        }
        .${PAGE_HINT_LINK_CLASS} {
            transform: translate(-100%, -35%);
        }
        .${PAGE_HINT_CENTERED_CLASS} {
            transform: translate(-50%, -50%);
        }
        `,
        PAGE_HINT_STYLE_ID,
    )
}

void injectPageHintStyles()

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const isHintCharacter = (key: string) => key.length === 1

const sanitizeAlphabet = (alphabet: readonly string[]) => {
    const normalized = alphabet.map(value => value.trim().toLowerCase()).filter(key => /^[a-z]$/.test(key))

    return [...new Set(normalized)]
}

const consumeKeyboardEvent = (event: KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
}

const resolveBlockElement = (target: PageHintTarget): HTMLElement | null =>
    (target.elementId ? (document.getElementById(target.elementId) as HTMLElement | null) : null) || target.element

const closestHintTargetAncestor = (element: Element): Element | null =>
    element.parentElement?.closest(LINK_TARGET_SELECTOR) ?? null

const isEligibleBlockTarget = (element: Element): element is HTMLElement =>
    element instanceof HTMLElement && Boolean(element.id) && isElementVisibleInViewport(element)

const isEligibleLinkTarget = (element: Element): element is HTMLElement =>
    element instanceof HTMLElement && isElementVisibleInViewport(element) && !closestHintTargetAncestor(element)

const selectedPanelElement = (): HTMLElement | null => {
    try {
        return VimRoamPanel.selected().selectedBlock().element.closest(PANEL_SELECTOR) as HTMLElement | null
    } catch {
        return null
    }
}

const compareTargets = (left: Omit<PageHintTarget, 'hint'>, right: Omit<PageHintTarget, 'hint'>) =>
    left.priorityTier - right.priorityTier || left.panelIndex - right.panelIndex || left.order - right.order

const buildHintLabels = (alphabet: string[], preferredAlphabet: string[], hintLength: number): string[] => {
    const alphabetIndex = new Map(alphabet.map((character, index) => [character, index]))
    const preferredCharacters = new Set(preferredAlphabet)
    const labels: string[] =
        hintLength === 1
            ? [...alphabet]
            : (() => {
                  const suffixes: string[] = buildHintLabels(alphabet, preferredAlphabet, hintLength - 1)
                  return alphabet.flatMap((character: string) => suffixes.map((suffix: string) => character + suffix))
              })()

    return labels.sort((left: string, right: string) => {
        const leftCharacters = [...left]
        const rightCharacters = [...right]
        const leftNonHomeRowCount = leftCharacters.filter(character => !preferredCharacters.has(character)).length
        const rightNonHomeRowCount = rightCharacters.filter(character => !preferredCharacters.has(character)).length

        if (leftNonHomeRowCount !== rightNonHomeRowCount) {
            return leftNonHomeRowCount - rightNonHomeRowCount
        }

        for (let index = 0; index < hintLength; index += 1) {
            const leftIsPreferred = preferredCharacters.has(leftCharacters[index])
            const rightIsPreferred = preferredCharacters.has(rightCharacters[index])
            if (leftIsPreferred !== rightIsPreferred) {
                return leftIsPreferred ? -1 : 1
            }
        }

        for (let index = hintLength - 1; index >= 0; index -= 1) {
            const leftIndex = alphabetIndex.get(leftCharacters[index]) ?? Number.MAX_SAFE_INTEGER
            const rightIndex = alphabetIndex.get(rightCharacters[index]) ?? Number.MAX_SAFE_INTEGER
            if (leftIndex !== rightIndex) {
                return leftIndex - rightIndex
            }
        }

        return 0
    })
}

export const generatePageHintLabels = (
    targetCount: number,
    alphabet: readonly string[] = pageHintAlphabet,
    preferredAlphabet: readonly string[] = pageHintHomeRowAlphabet,
) => {
    if (targetCount <= 0) {
        return []
    }

    const normalizedAlphabet = sanitizeAlphabet(alphabet)
    const activeAlphabet = normalizedAlphabet.length ? normalizedAlphabet : [...PAGE_HINT_ALPHABETS.qwerty]
    const normalizedPreferredAlphabet = sanitizeAlphabet(preferredAlphabet).filter(character =>
        activeAlphabet.includes(character),
    )
    const activePreferredAlphabet = normalizedPreferredAlphabet.length ? normalizedPreferredAlphabet : activeAlphabet
    const base = activeAlphabet.length
    const hintLength = Math.max(1, Math.ceil(Math.log(targetCount) / Math.log(base)))
    return buildHintLabels(activeAlphabet, activePreferredAlphabet, hintLength).slice(0, targetCount)
}

export const collectPageHintTargets = (scope: PageHintTargetScope = 'all'): PageHintTarget[] => {
    RoamPanel.tagPanels()

    const currentPanel = selectedPanelElement()
    const panels = Array.from(document.querySelectorAll(PANEL_SELECTOR)) as HTMLElement[]
    const orderedTargets = panels.flatMap((panel, panelIndex) => {
        const isCurrentPanel = panel === currentPanel
        const blockTargets =
            scope === 'links'
                ? []
                : Array.from(panel.querySelectorAll(BLOCK_TARGET_SELECTOR))
                      .filter(isEligibleBlockTarget)
                      .map<Omit<PageHintTarget, 'hint'>>((element, order) => ({
                          element,
                          elementId: element.id,
                          order,
                          panelIndex,
                          priorityTier: isCurrentPanel ? 0 : 2,
                          type: 'block',
                      }))

        const linkTargets =
            scope === 'blocks'
                ? []
                : Array.from(panel.querySelectorAll(LINK_TARGET_SELECTOR))
                      .filter(isEligibleLinkTarget)
                      .map<Omit<PageHintTarget, 'hint'>>((element, order) => ({
                          element,
                          order,
                          panelIndex,
                          priorityTier: isCurrentPanel ? 1 : 3,
                          type: 'link',
                      }))

        return [...blockTargets, ...linkTargets]
    })

    const sortedTargets = orderedTargets.sort(compareTargets)
    const hints = generatePageHintLabels(sortedTargets.length)
    return sortedTargets.map((target, index) => ({
        ...target,
        hint: hints[index],
    }))
}

const ensureHintRoot = () => {
    let root = document.querySelector(`.${PAGE_HINT_ROOT_CLASS}`) as HTMLElement | null
    if (root) {
        return root
    }

    root = document.createElement('div')
    root.className = PAGE_HINT_ROOT_CLASS
    root.setAttribute('aria-hidden', 'true')
    document.body.appendChild(root)
    return root
}

const getBlockHintPosition = (element: HTMLElement) => {
    const rect = getFirstClientRect(element) ?? element.getBoundingClientRect()
    return {
        left: clamp(rect.left + BLOCK_HINT_X_OFFSET, 4, window.innerWidth - 4),
        top: clamp(rect.top + Math.min(rect.height / 2, 10), 4, window.innerHeight - 4),
    }
}

const isCenteredLinkTarget = (element: HTMLElement) => element.matches(Selectors.multibar)

const getLinkHintPosition = (element: HTMLElement) => {
    if (isCenteredLinkTarget(element)) {
        const rect = element.getBoundingClientRect()
        return {
            left: clamp(rect.left + rect.width / 2, 4, window.innerWidth - 4),
            top: clamp(rect.top + rect.height / 2, 4, window.innerHeight - 4),
        }
    }

    const rect = getFirstClientRect(element) ?? element.getBoundingClientRect()
    return {
        left: clamp(rect.left + LINK_HINT_X_OFFSET, 4, window.innerWidth - 4),
        top: clamp(rect.top + Math.min(rect.height / 2, 10) + LINK_HINT_Y_OFFSET, 4, window.innerHeight - 4),
    }
}

const getHintPosition = (target: PageHintTarget) =>
    target.type === 'block' ? getBlockHintPosition(target.element) : getLinkHintPosition(target.element)

const renderPageHintSession = (session: ActivePageHintSession) => {
    const root = ensureHintRoot()
    root.innerHTML = ''

    const visibleTargets = session.targets.filter(target => target.hint.startsWith(session.prefix))
    visibleTargets.forEach(target => {
        const overlay = document.createElement('span')
        const suffix = target.hint.slice(session.prefix.length).toUpperCase()
        const {left, top} = getHintPosition(target)

        overlay.className = [
            PAGE_HINT_CLASS,
            target.type === 'block' ? PAGE_HINT_BLOCK_CLASS : PAGE_HINT_LINK_CLASS,
            target.type === 'link' && isCenteredLinkTarget(target.element) ? PAGE_HINT_CENTERED_CLASS : '',
        ].join(' ')
        overlay.textContent = suffix
        overlay.style.left = `${left}px`
        overlay.style.top = `${top}px`
        root.appendChild(overlay)
    })
}

const finishBlockSelection = async (target: PageHintTarget, mode: PageHintSelectionMode) => {
    if (mode === 'insert') {
        const block = resolveBlockElement(target)
        if (!block) {
            return
        }

        await Roam.focusBlockAtStart(block)
        updateVimView()
        return
    }

    if (getActiveEditElement()) {
        await returnToNormalMode()
    }

    const block = resolveBlockElement(target)
    if (!block) {
        return
    }

    const panel = VimRoamPanel.fromBlock(block)
    panel.select()
    panel.selectBlock(block.id)
    updateVimView()
}

const finishLinkSelection = async (target: PageHintTarget, openInSidebar: boolean) => {
    await Mouse.leftClick(target.element, {shiftKey: openInSidebar})
    updateVimView()
}

const completePageHintTarget = async (target: PageHintTarget, mode: PageHintSelectionMode, openInSidebar: boolean) => {
    stopPageHintSession()

    if (target.type === 'block') {
        await finishBlockSelection(target, mode)
        return
    }

    await finishLinkSelection(target, openInSidebar)
}

const updatePrefix = async (event: KeyboardEvent, session: ActivePageHintSession, nextPrefix: string) => {
    const matches = session.targets.filter(target => target.hint.startsWith(nextPrefix))
    if (!matches.length) {
        return
    }

    session.prefix = nextPrefix

    if (matches.length === 1 && matches[0].hint === nextPrefix) {
        session.isResolving = true
        await completePageHintTarget(matches[0], session.mode, event.shiftKey && matches[0].type === 'link')
        return
    }

    renderPageHintSession(session)
}

const normalizeHintKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !isHintCharacter(event.key)) {
        return null
    }

    return event.key.toLowerCase()
}

const handlePageHintKeydown = async (event: KeyboardEvent, session: ActivePageHintSession) => {
    if (activeSession !== session || session.isResolving) {
        consumeKeyboardEvent(event)
        return
    }

    if (event.key === 'Escape') {
        consumeKeyboardEvent(event)
        stopPageHintSession()
        updateVimView()
        return
    }

    if (event.key === 'Backspace') {
        consumeKeyboardEvent(event)
        if (!session.prefix) {
            stopPageHintSession()
            updateVimView()
            return
        }

        session.prefix = session.prefix.slice(0, -1)
        renderPageHintSession(session)
        return
    }

    const key = normalizeHintKey(event)
    if (!key) {
        return
    }

    consumeKeyboardEvent(event)
    await updatePrefix(event, session, session.prefix + key)
}

export const setPageHintAlphabet = (alphabet: readonly string[], preferredAlphabet: readonly string[] = alphabet) => {
    const normalizedAlphabet = sanitizeAlphabet(alphabet)
    pageHintAlphabet = normalizedAlphabet.length ? normalizedAlphabet : [...PAGE_HINT_ALPHABETS.qwerty]
    const normalizedPreferredAlphabet = sanitizeAlphabet(preferredAlphabet).filter(character =>
        pageHintAlphabet.includes(character),
    )
    pageHintHomeRowAlphabet = normalizedPreferredAlphabet.length ? normalizedPreferredAlphabet : [...pageHintAlphabet]
}

export const resetPageHintAlphabet = () => {
    pageHintAlphabet = [...PAGE_HINT_ALPHABETS.qwerty]
    pageHintHomeRowAlphabet = [...PAGE_HINT_HOME_ROW_ALPHABETS.qwerty]
}

export const stopPageHintSession = () => {
    if (!activeSession) {
        return
    }

    window.removeEventListener('keydown', activeSession.keydownHandler, true)
    window.removeEventListener('resize', activeSession.renderHandler)
    window.removeEventListener('scroll', activeSession.renderHandler, true)
    document.querySelector(`.${PAGE_HINT_ROOT_CLASS}`)?.remove()
    document.body.classList.remove(PAGE_HINT_BODY_CLASS)
    activeSession = null
    setPageHintSessionActive(false)
}

export const startPageHintSession = (mode: PageHintSelectionMode, scope: PageHintTargetScope = 'all') => {
    stopPageHintSession()

    const targets = collectPageHintTargets(scope)
    if (!targets.length) {
        return false
    }

    document.body.classList.add(PAGE_HINT_BODY_CLASS)
    setPageHintSessionActive(true)

    const session: ActivePageHintSession = {
        isResolving: false,
        keydownHandler: event => {
            void handlePageHintKeydown(event, session)
        },
        mode,
        prefix: '',
        renderHandler: () => renderPageHintSession(session),
        scope,
        targets,
    }

    activeSession = session
    window.addEventListener('keydown', session.keydownHandler, true)
    window.addEventListener('resize', session.renderHandler)
    window.addEventListener('scroll', session.renderHandler, true)
    renderPageHintSession(session)
    return true
}
