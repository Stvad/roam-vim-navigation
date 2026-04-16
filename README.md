# Roam Toolkit Vim Mode

Vim-like block navigation and editing for Roam (originally developed in Roam Toolkit browser extension)

![](./media/vim_demo.gif)

To discover all available shortcuts, check the plugin settings in Roam.

## What It Includes

- Vim-like block navigation
- Visual mode and block selection helpers
- Block editing, movement, clipboard, history, and date shortcuts
- Roam-native settings stored through `extensionAPI.settings`

## Settings Model

- `Keyboard Layout` switches the layout-sensitive bindings between `qwerty` and `colemak`
- shortcuts are grouped by the modes they apply to, and each binding is editable through a Roam settings input
- `Reset Shortcuts` restores the default keymap

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
