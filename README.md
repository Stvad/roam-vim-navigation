# Roam Toolkit Vim Mode

Standalone [Roam Research](https://roamresearch.com) plugin that extracts the Vim mode from the old Roam Toolkit browser extension.

![](./media/vim_demo.gif)

## What It Includes

- Vim-like block navigation
- Visual mode and block selection helpers
- Block editing, movement, clipboard, history, and date shortcuts
- Roam-native settings stored through `extensionAPI.settings`

## Settings Model

The plugin no longer depends on the extension popup/options UI, background page, or Redux-backed browser storage.

All configuration now lives in Roam's plugin settings panel:

- `Keyboard Layout` switches the layout-sensitive bindings between `qwerty` and `colemak`
- `Enable Vim Mode` toggles the runtime on and off
- each shortcut is editable through a Roam settings input
- `Reset Shortcuts` restores the default keymap

## Build

```bash
npm install
npm run build:vim-plugin
```

That generates:

- `dist/roam-vim-plugin.js` – bundled runtime
- `dist/extension.js` – Roam-compatible entrypoint for hosted installs

The repo root also contains:

- `extension.js` – wrapper entrypoint for repo-root based installs
- `build.sh` – Roam Depot compatible build script

## Development Notes

- The standalone plugin entry lives in `src/ts/roam-vim-plugin/`
- The Vim runtime is still reused from `src/ts/core/features/vim-mode/`
- CI and GitHub Pages now build the standalone plugin artifact instead of the old extension bundle
