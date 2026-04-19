import {injectStyle, removeStyle} from 'src/core/common/css'
import {getActiveEditElement} from 'src/core/common/dom'
import {Shortcut} from 'src/core/features/vim-mode/types'

export type ShortcutHelpEntry = {
    id: string
    key: string
    label: string
    modes: string[]
}

const HELP_PANEL_ROOT_ID = 'roam-toolkit--vim-help-panel-root'
const HELP_PANEL_STYLE_ID = 'roam-toolkit-block-mode--help'
const HELP_PANEL_BACKDROP_CSS_CLASS = 'roam-toolkit--vim-help-panel-backdrop'
const HELP_PANEL_DIALOG_CSS_CLASS = 'roam-toolkit--vim-help-panel'
const HELP_PANEL_HEADER_CSS_CLASS = 'roam-toolkit--vim-help-panel__header'
const HELP_PANEL_TITLE_CSS_CLASS = 'roam-toolkit--vim-help-panel__title'
const HELP_PANEL_SUBTITLE_CSS_CLASS = 'roam-toolkit--vim-help-panel__subtitle'
const HELP_PANEL_CONTENT_CSS_CLASS = 'roam-toolkit--vim-help-panel__content'
const HELP_PANEL_SECTION_CSS_CLASS = 'roam-toolkit--vim-help-panel__section'
const HELP_PANEL_SECTION_TITLE_CSS_CLASS = 'roam-toolkit--vim-help-panel__section-title'
const HELP_PANEL_ROW_CSS_CLASS = 'roam-toolkit--vim-help-panel__row'
const HELP_PANEL_KEY_CSS_CLASS = 'roam-toolkit--vim-help-panel__key'
const HELP_PANEL_KEY_CHORDS_CSS_CLASS = 'roam-toolkit--vim-help-panel__key-chords'
const HELP_PANEL_KEY_SEPARATOR_CSS_CLASS = 'roam-toolkit--vim-help-panel__key-separator'
const HELP_PANEL_DESCRIPTION_CSS_CLASS = 'roam-toolkit--vim-help-panel__description'
const HELP_PANEL_EMPTY_CSS_CLASS = 'roam-toolkit--vim-help-panel__empty'

const MODE_ORDER = ['normal', 'visual', 'hint', 'insert'] as const
const MODE_LABELS: Record<string, string> = {
    hint: 'Hint',
    insert: 'Insert',
    normal: 'Normal',
    visual: 'Visual',
}

let shortcutHelpEntries: ShortcutHelpEntry[] = []
let cleanupHelpPanelListeners = () => {}

const modeSortIndex = (mode: string) => {
    const index = MODE_ORDER.indexOf(mode as (typeof MODE_ORDER)[number])
    return index === -1 ? MODE_ORDER.length : index
}

const normalizeModeGroup = ({modes}: Pick<ShortcutHelpEntry, 'modes'>) =>
    [...new Set(modes)].sort((left, right) => modeSortIndex(left) - modeSortIndex(right)).join('+')

const compareModeGroups = (left: string, right: string) => {
    const leftModes = left.split('+').filter(Boolean)
    const rightModes = right.split('+').filter(Boolean)
    const sharedLength = Math.min(leftModes.length, rightModes.length)

    for (let index = 0; index < sharedLength; index += 1) {
        const leftSortIndex = modeSortIndex(leftModes[index])
        const rightSortIndex = modeSortIndex(rightModes[index])

        if (leftSortIndex !== rightSortIndex) {
            return leftSortIndex - rightSortIndex
        }
    }

    if (leftModes.length !== rightModes.length) {
        return leftModes.length - rightModes.length
    }

    return left.localeCompare(right)
}

const getModeGroupLabel = (group: string) => {
    const labels = group
        .split('+')
        .filter(Boolean)
        .map(mode => MODE_LABELS[mode] ?? mode)
        .join(' + ')

    return `${labels} ${group.includes('+') ? 'Modes' : 'Mode'}`
}

const displayModifier = (token: string) => {
    const normalized = token.toLowerCase()

    if (normalized === 'cmd' || normalized === 'command') {
        return 'Cmd'
    }
    if (normalized === 'ctrl') {
        return 'Ctrl'
    }
    if (normalized === 'alt') {
        return 'Alt'
    }
    if (normalized === 'shift') {
        return 'Shift'
    }

    return token
}

const displayKey = (token: string, modifiers: string[]) => {
    const normalized = token.toLowerCase()

    if (
        (normalized === '/' || normalized === '(slash)') &&
        modifiers.map(modifier => modifier.toLowerCase()).includes('shift')
    ) {
        return '?'
    }
    if (normalized === '(slash)') {
        return '/'
    }
    if (normalized === 'esc' || normalized === 'escape') {
        return 'Esc'
    }
    if (normalized === 'space') {
        return 'Space'
    }
    if (normalized === 'up') {
        return 'Up'
    }
    if (normalized === 'down') {
        return 'Down'
    }
    if (normalized === 'left') {
        return 'Left'
    }
    if (normalized === 'right') {
        return 'Right'
    }

    return token.length === 1 ? token : token[0].toUpperCase() + token.slice(1)
}

const displayKeyPress = (press: string) => {
    const parts = press
        .split('+')
        .map(part => part.trim())
        .filter(Boolean)

    const key = parts.pop() ?? ''
    const displayKeyValue = displayKey(key, parts)
    const modifiers = parts
        .filter(modifier => !(displayKeyValue === '?' && modifier.toLowerCase() === 'shift'))
        .map(displayModifier)
    const displayParts = [...modifiers, displayKeyValue]

    return displayParts.join('+')
}

const createHelpPanelStyles = () =>
    injectStyle(
        `
        .${HELP_PANEL_BACKDROP_CSS_CLASS} {
            align-items: flex-start;
            background: rgba(34, 29, 24, 0.34);
            display: flex;
            inset: 0;
            justify-content: center;
            overflow-y: auto;
            padding: 40px 20px;
            position: fixed;
            z-index: 2147483646;
        }
        .${HELP_PANEL_DIALOG_CSS_CLASS} {
            background: #fffdf8;
            border: 1px solid rgba(87, 68, 44, 0.18);
            border-radius: 16px;
            box-shadow: 0 24px 80px rgba(53, 39, 21, 0.24);
            color: #3a2a17;
            max-height: calc(100vh - 80px);
            max-width: 920px;
            overflow: hidden;
            width: min(920px, 100%);
        }
        .${HELP_PANEL_HEADER_CSS_CLASS} {
            background: linear-gradient(135deg, #fff4de 0%, #fffdf8 100%);
            border-bottom: 1px solid rgba(87, 68, 44, 0.12);
            padding: 24px 28px 18px;
        }
        .${HELP_PANEL_TITLE_CSS_CLASS} {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
        }
        .${HELP_PANEL_SUBTITLE_CSS_CLASS} {
            color: #70583a;
            font-size: 13px;
            margin: 6px 0 0;
        }
        .${HELP_PANEL_CONTENT_CSS_CLASS} {
            max-height: calc(100vh - 190px);
            overflow-y: auto;
            padding: 20px 28px 28px;
        }
        .${HELP_PANEL_SECTION_CSS_CLASS} + .${HELP_PANEL_SECTION_CSS_CLASS} {
            margin-top: 22px;
        }
        .${HELP_PANEL_SECTION_TITLE_CSS_CLASS} {
            border-bottom: 1px solid rgba(87, 68, 44, 0.1);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin: 0 0 12px;
            padding-bottom: 8px;
            text-transform: uppercase;
        }
        .${HELP_PANEL_ROW_CSS_CLASS} {
            align-items: center;
            column-gap: 20px;
            display: grid;
            grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
            padding: 7px 0;
        }
        .${HELP_PANEL_KEY_CSS_CLASS} {
            min-width: 0;
        }
        .${HELP_PANEL_KEY_CHORDS_CSS_CLASS} {
            align-items: center;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .${HELP_PANEL_KEY_CSS_CLASS} kbd {
            background: #fff;
            border: 1px solid rgba(87, 68, 44, 0.18);
            border-bottom-width: 2px;
            border-radius: 8px;
            box-shadow: inset 0 -1px 0 rgba(87, 68, 44, 0.06);
            display: inline-flex;
            font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 8px;
            white-space: nowrap;
        }
        .${HELP_PANEL_KEY_SEPARATOR_CSS_CLASS} {
            color: #8a7152;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .${HELP_PANEL_DESCRIPTION_CSS_CLASS} {
            min-width: 0;
        }
        .${HELP_PANEL_EMPTY_CSS_CLASS} {
            color: #70583a;
            font-size: 14px;
            padding: 8px 0 4px;
        }
        @media (max-width: 720px) {
            .${HELP_PANEL_BACKDROP_CSS_CLASS} {
                padding: 16px;
            }
            .${HELP_PANEL_DIALOG_CSS_CLASS} {
                max-height: calc(100vh - 32px);
            }
            .${HELP_PANEL_CONTENT_CSS_CLASS} {
                max-height: calc(100vh - 150px);
                padding: 18px 18px 20px;
            }
            .${HELP_PANEL_HEADER_CSS_CLASS} {
                padding: 18px 18px 14px;
            }
            .${HELP_PANEL_ROW_CSS_CLASS} {
                grid-template-columns: minmax(0, 1fr);
                row-gap: 8px;
            }
        }
        `,
        HELP_PANEL_STYLE_ID,
    )

const createKeyElement = (keySequence: string) => {
    const container = document.createElement('div')
    container.className = HELP_PANEL_KEY_CSS_CLASS

    const chords = document.createElement('div')
    chords.className = HELP_PANEL_KEY_CHORDS_CSS_CLASS

    keySequence
        .split(' ')
        .map(press => press.trim())
        .filter(Boolean)
        .forEach((press, index) => {
            if (index > 0) {
                const separator = document.createElement('span')
                separator.className = HELP_PANEL_KEY_SEPARATOR_CSS_CLASS
                separator.textContent = 'then'
                chords.appendChild(separator)
            }

            const key = document.createElement('kbd')
            key.textContent = displayKeyPress(press)
            chords.appendChild(key)
        })

    container.appendChild(chords)
    return container
}

const createRow = ({key, label}: ShortcutHelpEntry) => {
    const row = document.createElement('div')
    row.className = HELP_PANEL_ROW_CSS_CLASS
    row.appendChild(createKeyElement(key))

    const description = document.createElement('div')
    description.className = HELP_PANEL_DESCRIPTION_CSS_CLASS
    description.textContent = label
    row.appendChild(description)

    return row
}

const createSection = (group: string, entries: ShortcutHelpEntry[]) => {
    const section = document.createElement('section')
    section.className = HELP_PANEL_SECTION_CSS_CLASS

    const title = document.createElement('h2')
    title.className = HELP_PANEL_SECTION_TITLE_CSS_CLASS
    title.textContent = getModeGroupLabel(group)
    section.appendChild(title)

    entries
        .slice()
        .sort((left, right) => left.label.localeCompare(right.label))
        .forEach(entry => section.appendChild(createRow(entry)))

    return section
}

const createContent = () => {
    const content = document.createElement('div')
    content.className = HELP_PANEL_CONTENT_CSS_CLASS

    if (shortcutHelpEntries.length === 0) {
        const emptyState = document.createElement('div')
        emptyState.className = HELP_PANEL_EMPTY_CSS_CLASS
        emptyState.textContent = 'No shortcuts registered.'
        content.appendChild(emptyState)
        return content
    }

    const groupedEntries = shortcutHelpEntries.reduce<Record<string, ShortcutHelpEntry[]>>((acc, entry) => {
        const group = normalizeModeGroup(entry)
        if (!acc[group]) {
            acc[group] = []
        }
        acc[group].push(entry)
        return acc
    }, {})

    Object.keys(groupedEntries)
        .sort(compareModeGroups)
        .forEach(group => content.appendChild(createSection(group, groupedEntries[group])))

    return content
}

const createDialog = () => {
    const dialog = document.createElement('div')
    dialog.className = HELP_PANEL_DIALOG_CSS_CLASS
    dialog.setAttribute('aria-label', 'Roam Vim Help')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('role', 'dialog')

    const header = document.createElement('div')
    header.className = HELP_PANEL_HEADER_CSS_CLASS

    const title = document.createElement('h1')
    title.className = HELP_PANEL_TITLE_CSS_CLASS
    title.textContent = 'Roam Vim Help'
    header.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.className = HELP_PANEL_SUBTITLE_CSS_CLASS
    subtitle.textContent = 'Generated from registered shortcuts. Press ? or Escape to close.'
    header.appendChild(subtitle)

    dialog.append(header, createContent())
    dialog.addEventListener('click', event => event.stopPropagation())

    return dialog
}

const createHelpPanelRoot = () => {
    const root = document.createElement('div')
    root.id = HELP_PANEL_ROOT_ID
    root.className = HELP_PANEL_BACKDROP_CSS_CLASS
    root.appendChild(createDialog())
    root.addEventListener('click', closeHelpPanel)

    return root
}

const isHelpPanelOpen = () => Boolean(document.getElementById(HELP_PANEL_ROOT_ID))

const renderHelpPanel = () => {
    closeHelpPanel()
    createHelpPanelStyles()

    const helpPanelRoot = createHelpPanelRoot()
    document.body.appendChild(helpPanelRoot)

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') {
            return
        }

        event.preventDefault()
        event.stopPropagation()
        closeHelpPanel()
    }

    const onFocusIn = () => {
        if (getActiveEditElement()) {
            closeHelpPanel()
        }
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn, true)
    cleanupHelpPanelListeners = () => {
        document.removeEventListener('keydown', onKeyDown, true)
        document.removeEventListener('focusin', onFocusIn, true)
    }
}

export const createShortcutHelpEntries = (
    shortcuts: Shortcut[],
    keyMap: Record<string, string | undefined>,
): ShortcutHelpEntry[] =>
    shortcuts.map(shortcut => ({
        id: shortcut.id,
        key: keyMap[shortcut.id] || shortcut.initValue,
        label: shortcut.label,
        modes: shortcut.modes,
    }))

export const setShortcutHelpEntries = (entries: ShortcutHelpEntry[]) => {
    shortcutHelpEntries = entries

    if (isHelpPanelOpen()) {
        renderHelpPanel()
    }
}

export const toggleHelpPanel = () => {
    if (isHelpPanelOpen()) {
        closeHelpPanel()
        return
    }

    renderHelpPanel()
}

export const closeHelpPanel = () => {
    cleanupHelpPanelListeners()
    cleanupHelpPanelListeners = () => {}
    document.getElementById(HELP_PANEL_ROOT_ID)?.remove()
}

export const resetHelpPanel = () => {
    closeHelpPanel()
    shortcutHelpEntries = []
    removeStyle(HELP_PANEL_STYLE_ID)
}
