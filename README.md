# Roam Toolkit Vim Mode

Standalone Vim-like navigation and editing for Roam Research, extracted from the original Roam Toolkit browser extension.

![Roam Toolkit Vim Mode demo](https://raw.githubusercontent.com/Stvad/roam-vim-navigation/master/media/vim_demo.gif)

This README summarizes the current functionality, but the authoritative up-to-date shortcut list is in Roam under `Settings -> Extensions -> Roam Toolkit Vim Mode`, where every binding is editable.

## Current Functionality

- Normal, insert, and visual-mode style workflows for Roam blocks
- Block navigation across the current panel:
    - move up and down
    - jump to the first or last visible block
    - jump to the first or last block in the panel
    - move by larger chunks and scroll while keeping selection visible
- Panel navigation:
    - switch between left and right panels
    - close the current sidebar page
- Roam navigation helpers:
    - toggle block folding
    - collapse into the parent block
    - expand the last reference breadcrumb
    - open the parent page or mentions, either in the main view or sidebar
- Editing helpers:
    - enter edit mode at the start or end of the selected block
    - insert a block before or after the current one
    - return to normal mode with `Escape`
- Visual mode helpers:
    - enter visual mode on the selected block
    - grow selection upward or downward
- Clipboard helpers:
    - copy, cut, paste, and paste before
    - copy a block reference
    - copy a block embed
- Block manipulation:
    - move the current block up or down among siblings
- History helpers:
    - undo and redo
- Hint-based actions:
    - inline hints for clickable targets inside the selected block
    - page-wide hints for visible blocks and links
    - page hints can either select a target in normal mode or jump directly into insert mode
- Roam-specific editing helpers:
    - toggle `TODO` / `DONE`
    - increment or decrement a single date reference by a day or a week
    - reschedule SRS-style notes using the built-in SM2/Anki scheduler helpers

## Settings Model

- `Keyboard Layout` switches layout-sensitive defaults between `qwerty` and `colemak`
- layout-sensitive bindings update from that preset, and page-hint labels follow the selected alphabet
- if the browser exposes keyboard layout change events, the plugin re-registers hotkeys automatically when the system layout changes
- shortcuts are grouped by mode in the Roam settings panel, and each binding can be customized there
- `Reset Shortcuts` restores the default keymap for the selected layout

## Build

```bash
npm install
npm run build
```

That generates a direct Roam entry module at:

- `extension.js` – bundled Roam-compatible module at the repo root
- `dist/extension.js` – copy for hosted installs such as GitHub Pages
- `dist/README.md` – copied alongside the build to satisfy the Roam extension package contract

`build.sh` runs the same direct build for Roam Depot compatible installs.

## Development Notes

- The standalone plugin entry lives in `src/ts/roam-vim-plugin/`
- The Vim runtime is still reused from `src/ts/core/features/vim-mode/`
- CI and GitHub Pages lint, typecheck, test, and build the direct `extension.js` artifact instead of the old extension bundle

## Attribution

Most of the original Vim functionality in Roam Toolkit was developed by Dave Lu (@tntmarket on GitHub).
