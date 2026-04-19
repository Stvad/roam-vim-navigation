# Roam Toolkit Vim Mode

Standalone Vim-like navigation and editing for Roam Research, extracted from the original Roam Toolkit browser extension.

![Roam Toolkit Vim Mode demo](https://raw.githubusercontent.com/Stvad/roam-vim-navigation/master/media/vim_demo.gif)

This README summarizes the current functionality, but the authoritative up-to-date shortcut list is in Roam under `Settings -> Extensions -> Roam Toolkit Vim Mode`, where every binding is editable.

## Current Functionality

- Normal, insert, and visual-mode style workflows for Roam blocks
- Vim-like navigation within the current panel and across sidebars
- Selection, clipboard, block movement, history, hinting, and Roam-specific editing helpers

## Default Keybindings

Default layout preset is `qwerty`. The Roam settings panel remains the authoritative live list, because every shortcut can be remapped there.

If you switch `Keyboard Layout` to `colemak`, these defaults change:

| Action                                     | QWERTY         | Colemak        |
| ------------------------------------------ | -------------- | -------------- |
| Select Block Up                            | `k`            | `h`            |
| Select Block Down                          | `j`            | `k`            |
| Select Panel Left                          | `h`            | `j`            |
| Move Block Up                              | `Cmd+Shift+K`  | `Cmd+Shift+H`  |
| Move Block Down                            | `Cmd+Shift+J`  | `Cmd+Shift+K`  |
| Increment Date (layout up key)             | `Ctrl+Alt+K`   | `Ctrl+Alt+H`   |
| Decrement Date (layout down key)           | `Ctrl+Alt+J`   | `Ctrl+Alt+K`   |
| Increment Date by a week (layout up key)   | `Ctrl+Shift+K` | `Ctrl+Shift+H` |
| Decrement Date by a week (layout down key) | `Ctrl+Shift+J` | `Ctrl+Shift+K` |

Page-hint labels also switch to a Colemak-friendly alphabet when that layout preset is selected.

### Navigation and Panels

| Mode            | Keys           | Action                                                            |
| --------------- | -------------- | ----------------------------------------------------------------- |
| Normal + Visual | `k`            | Select block up                                                   |
| Normal + Visual | `j`            | Select block down                                                 |
| Normal          | `Shift+H`      | Select first visible block                                        |
| Normal          | `Shift+L`      | Select last visible block                                         |
| Normal          | `g g`          | Select first block                                                |
| Normal          | `Shift+G`      | Select last block                                                 |
| Normal          | `Ctrl+U`       | Jump up by several blocks                                         |
| Normal          | `Ctrl+D`       | Jump down by several blocks                                       |
| Normal + Visual | `Ctrl+Y`       | Scroll up while keeping selection visible                         |
| Normal + Visual | `Ctrl+E`       | Scroll down while keeping selection visible                       |
| Normal + Insert | `Alt+Z`        | Expand last reference breadcrumb                                  |
| Normal          | `Shift+Z`      | Collapse the current page view inside references or query results |
| Normal          | `1`            | Open parent page                                                  |
| Normal          | `Shift+1`      | Open parent page in sidebar                                       |
| Normal          | `2`            | Open mentions                                                     |
| Normal          | `Shift+2`      | Open mentions in sidebar                                          |
| Normal          | `z`            | Toggle fold block                                                 |
| Normal          | `Ctrl+Shift+Z` | Collapse into parent block                                        |
| Normal          | `h`            | Select panel left                                                 |
| Normal          | `l`            | Select panel right                                                |
| All             | `Ctrl+W`       | Close current sidebar page                                        |

### Editing, Selection, and Clipboard

| Mode            | Keys          | Action                                             |
| --------------- | ------------- | -------------------------------------------------- |
| All             | `Escape`      | Return to normal mode                              |
| Normal          | `i`           | Edit selected block at start of line               |
| Normal          | `a`           | Edit selected block at end of line                 |
| Normal          | `Shift+A`     | Edit selected block at end of line                 |
| Normal          | `Shift+O`     | Insert block before current block                  |
| Normal          | `o`           | Insert block after current block                   |
| Normal          | `v`           | Enter visual mode                                  |
| Normal + Visual | `Shift+K`     | Grow selection upward                              |
| Normal + Visual | `Shift+J`     | Grow selection downward                            |
| Normal          | `p`           | Paste below current block                          |
| Normal          | `Shift+P`     | Paste before current block                         |
| Normal + Visual | `y`           | Copy selected block or selection                   |
| Normal + Visual | `Alt+Y`       | Copy block reference                               |
| Normal + Visual | `Shift+Y`     | Copy block embed                                   |
| Normal + Visual | `d`           | Enter visual mode, or cut current visual selection |
| Normal + Insert | `Cmd+Shift+K` | Move current block up                              |
| Normal + Insert | `Cmd+Shift+J` | Move current block down                            |
| Normal          | `u`           | Undo                                               |
| Normal          | `Ctrl+R`      | Redo                                               |

### Hints

| Mode   | Keys                                                                                                           | Action                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Normal | `q`, `w`, `e`, `r`, `t`, `f`, `b`                                                                              | Click inline hint targets `0` through `6` inside the selected block |
| Normal | `Shift+q`, `Shift+w`, `Shift+e`, `Shift+r`, `Shift+t`, `Shift+f`, `Shift+b`                                    | Shift-click inline hint targets `0` through `6`                     |
| Normal | `Ctrl+Shift+q`, `Ctrl+Shift+w`, `Ctrl+Shift+e`, `Ctrl+Shift+r`, `Ctrl+Shift+t`, `Ctrl+Shift+f`, `Ctrl+Shift+b` | Modifier-click inline hint targets `0` through `6`                  |
| Normal | `s`                                                                                                            | Start page-wide hint mode for visible blocks only                   |
| Normal | `Shift+S`                                                                                                      | Start page-wide hint mode for visible blocks and links              |
| Normal | `g l`                                                                                                          | Start page-wide hint mode for visible links only                    |
| Normal | `Shift+I`                                                                                                      | Start page-wide hint mode for visible blocks and enter insert mode  |

### Roam-Specific Helpers

| Mode   | Keys              | Action                                                                               |
| ------ | ----------------- | ------------------------------------------------------------------------------------ |
| Normal | `Cmd+Enter`       | Toggle `TODO` / `DONE`                                                               |
| Normal | `Ctrl+Shift+1`    | Reschedule current SRS note as `AGAIN`                                               |
| Normal | `Ctrl+Shift+2`    | Reschedule current SRS note as `HARD`                                                |
| Normal | `Ctrl+Shift+3`    | Reschedule current SRS note as `GOOD`                                                |
| Normal | `Ctrl+Shift+4`    | Reschedule current SRS note as `EASY`                                                |
| Normal | `Ctrl+Alt+Up`     | Increment the only date reference in the block by one day                            |
| Normal | `Ctrl+Alt+Down`   | Decrement the only date reference in the block by one day                            |
| Normal | `Ctrl+Alt+K`      | Increment the only date reference in the block by one day using the layout up key    |
| Normal | `Ctrl+Alt+J`      | Decrement the only date reference in the block by one day using the layout down key  |
| Normal | `Ctrl+Shift+Up`   | Increment the only date reference in the block by one week                           |
| Normal | `Ctrl+Shift+Down` | Decrement the only date reference in the block by one week                           |
| Normal | `Ctrl+Shift+K`    | Increment the only date reference in the block by one week using the layout up key   |
| Normal | `Ctrl+Shift+J`    | Decrement the only date reference in the block by one week using the layout down key |

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
