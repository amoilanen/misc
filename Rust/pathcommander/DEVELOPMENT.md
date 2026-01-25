# Development Guide

## Prerequisites

### All Platforms

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable via rustup)
- npm (comes with Node.js)

### Linux

Install system dependencies for Tauri:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Arch Linux
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl libxdo librsvg

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libxdo-devel librsvg2-devel
```

### macOS

- Xcode Command Line Tools: `xcode-select --install`
- No additional system dependencies needed

### Windows

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10+)

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd pathcommander

# Install Node.js dependencies
npm install

# Generate SvelteKit types (needed for TypeScript)
npx svelte-kit sync
```

## Development

```bash
# Start development server (hot-reload for frontend, rebuilds Rust on changes)
npm run tauri dev

# Run frontend tests
npm run test

# Run frontend tests in watch mode
npm run test:watch

# Run backend tests
cd src-tauri && cargo test

# Type-check the frontend
npm run check

# Build for production
npm run tauri build
```

## Project Structure

```
pathcommander/
├── src/                     # Svelte frontend
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── stores/         # State management (Svelte 5 runes)
│   │   ├── services/       # Tauri commands, keyboard, watcher
│   │   ├── plugins/        # Plugin system (TypeScript side)
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Formatting utilities
│   └── routes/             # SvelteKit routes
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── models/         # Data structures
│   │   ├── plugins/        # Plugin system (Rust side)
│   │   ├── watcher.rs      # FS watcher
│   │   └── error.rs        # Error types
│   └── Cargo.toml
├── tests/                  # E2E tests
└── package.json
```

## Architecture

### Backend (Rust)

The Tauri backend handles all file system operations:

- `commands/fs_read.rs` - Directory listing, file info
- `commands/fs_ops.rs` - Copy, move, delete, rename, mkdir
- `commands/fs_watch.rs` - File system change watching
- `watcher.rs` - notify-rs based FS watcher that emits events to the frontend
- `plugins/mod.rs` - BackendPlugin trait for extending operations

### Frontend (Svelte 5)

- `stores/panes.svelte.ts` - Central state using Svelte 5 runes ($state, $derived)
- `services/tauri-commands.ts` - Typed wrappers for Rust command invocations
- `services/keyboard.ts` - Keyboard shortcut binding and dispatch
- `services/watcher.ts` - Listens to FS change events from the backend
- `plugins/registry.ts` - TypeScript plugin registration and hook dispatch

### Plugin System

**TypeScript plugins** (UI-side):
- Implement the `PathCommanderPlugin` interface
- Can add context menu items, toolbar buttons, keyboard shortcuts
- Hook into file operations (before/after copy, delete, move)

**Rust plugins** (backend-side):
- Implement the `BackendPlugin` trait
- Can intercept file operations before they execute
- Handle custom commands

## Testing

### Frontend Tests

Tests are co-located with source files (`*.test.ts`). Run with:

```bash
npm run test        # Single run
npm run test:watch  # Watch mode
```

Uses Vitest + @testing-library/svelte + jsdom.

### Backend Tests

In-module `#[cfg(test)]` blocks using `tempfile` for FS operations:

```bash
cd src-tauri
cargo test              # All tests
cargo test fs_read      # Specific module
```

## Building for Release

```bash
# Build optimized binary for current platform
npm run tauri build
```

Output is in `src-tauri/target/release/bundle/`.

### Cross-Compilation

For cross-platform builds, use the CI workflows or add Rust targets:

```bash
# Add target (example for macOS from Linux - requires cross-compilation toolchain)
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
rustup target add x86_64-pc-windows-msvc
```

In practice, cross-platform builds are handled by the GitHub Actions CI.
