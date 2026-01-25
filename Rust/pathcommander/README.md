# PathCommander

A cross-platform dual-pane file manager built with [Tauri 2](https://v2.tauri.app/), [Svelte 5](https://svelte.dev/), and [Tailwind CSS](https://tailwindcss.com/).

Inspired by Far Manager, Double Commander, and Dolphin.

## Features

- **Dual-pane interface** - view and manage files in two side-by-side panels
- **Keyboard-driven** - Far Manager-style shortcuts for all operations
- **File operations** - copy, move, rename, delete, create directories
- **File system watching** - panels auto-refresh when files change
- **Plugin system** - extend with TypeScript (UI) and Rust (backend) plugins
- **Cross-platform** - runs on Linux, macOS, and Windows

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Switch active pane |
| Enter | Open file / Enter directory |
| Backspace | Go to parent directory |
| F2 | Rename |
| F5 | Copy to other pane |
| F6 | Move to other pane |
| F7 | Create directory |
| F8 | Delete (to trash) |
| Insert / Space | Toggle selection |
| Arrow Up/Down | Move cursor |
| Home / End | Jump to first/last item |
| Ctrl+R | Refresh both panes |
| Ctrl+H | Toggle hidden files |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run tests
npm run test          # Frontend tests
cd src-tauri && cargo test  # Backend tests

# Build for production
npm run tauri build
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

## Tech Stack

- **Backend**: Rust + Tauri 2.x
- **Frontend**: Svelte 5 + TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest (frontend), cargo test (backend)

## License

MIT
