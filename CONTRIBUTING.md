# Contributing

## Scope

This repository now contains a single standalone Roam Research extension: the Vim navigation and editing plugin.

The old browser-extension packaging, popup/options UI, background scripts, and unrelated Toolkit features are intentionally gone. New changes should stay within the scope of the Vim plugin unless there is a clear reason to expand it.

## Prerequisites

1. Install a current Node.js release with npm.
2. Fork the repository and clone your fork locally.
3. Install dependencies:

```bash
npm install
```

## Local Development

Build the extension bundle with:

```bash
npm run build
```

That generates:

- `extension.js` at the repository root
- `dist/extension.js`
- `dist/README.md`

For a full local verification pass, run:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

## Repository Layout

- `src/ts/roam-vim-plugin/`: standalone Roam extension entrypoint, settings integration, and plugin wiring
- `src/ts/core/features/vim-mode/`: Vim runtime, commands, view logic, and Roam-specific behavior
- `src/ts/core/hotkeys/`: hotkey integration used by the plugin
- `src/ts/core/roam/`: Roam DOM and API helpers reused by the Vim feature
- `tests/ts/`: Jest coverage for shared utilities, hotkeys, Vim behavior, and plugin settings
- `scripts/build-roam-vim-plugin.mjs`: esbuild-based standalone extension bundle

## Settings and Behavior

- Plugin settings are stored through `extensionAPI.settings`
- Layout-sensitive defaults are controlled through the `Keyboard Layout` setting
- Shortcut settings are grouped by Vim mode in the Roam settings panel
- Vim mode is enabled when the extension loads; users disable it by disabling the extension

## Pull Requests

Keep changes narrow and directly related to the standalone Vim extension. If you remove dead code or dependencies, also update the build scripts, docs, and CI workflow references in the same change so the repo stays internally consistent.
