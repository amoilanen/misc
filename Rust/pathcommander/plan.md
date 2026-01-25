# PathCommander - Implementation Plan

## Overview
Cross-platform dual-pane file manager built with Tauri 2.x, Svelte 5, TypeScript, and Tailwind CSS. Inspired by Far Manager, DoubleCommander, and Dolphin.

## Tech Stack
- **Backend**: Rust + Tauri 2.x
- **Frontend**: Svelte 5 (runes) + TypeScript + SvelteKit (static adapter)
- **Styling**: Tailwind CSS
- **Plugins**: TypeScript (frontend) + Rust trait (backend)
- **Testing**: `cargo test` (Rust) + Vitest + Testing Library (frontend)

---

## Project Structure

```
pathcommander/
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── error.rs
│       ├── watcher.rs
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── fs_read.rs       # list_directory, get_file_info, get_disk_usage
│       │   ├── fs_ops.rs        # copy, move, delete, rename, mkdir
│       │   └── fs_watch.rs      # watch/unwatch directory
│       ├── models/
│       │   ├── mod.rs
│       │   └── file_entry.rs    # FileEntry, FileType, FilePermissions
│       └── plugins/
│           ├── mod.rs            # BackendPlugin trait, PluginManager
│           └── loader.rs
├── src/
│   ├── app.html
│   ├── app.css
│   ├── routes/
│   │   ├── +layout.ts           # ssr = false
│   │   └── +page.svelte
│   └── lib/
│       ├── components/
│       │   ├── App.svelte        # Root layout: toolbar + dual pane + statusbar
│       │   ├── FilePane.svelte   # Single pane (path bar + file list + footer)
│       │   ├── FileList.svelte   # Scrollable file list
│       │   ├── FileRow.svelte    # Single file row
│       │   ├── PathBar.svelte    # Current path breadcrumbs
│       │   ├── Toolbar.svelte    # F-key button bar
│       │   ├── StatusBar.svelte  # Disk usage, operation status
│       │   ├── ConfirmDialog.svelte
│       │   ├── MkdirDialog.svelte
│       │   └── ProgressDialog.svelte
│       ├── stores/
│       │   └── panes.svelte.ts   # Dual-pane state (Svelte 5 runes)
│       ├── services/
│       │   ├── tauri-commands.ts # Typed invoke() wrappers
│       │   ├── keyboard.ts      # Keyboard shortcut manager
│       │   └── watcher.ts       # FS change event listener
│       ├── plugins/
│       │   ├── types.ts          # PathCommanderPlugin interface
│       │   ├── registry.ts       # Plugin lifecycle management
│       │   └── loader.ts         # Plugin discovery
│       ├── types/
│       │   └── file.ts           # FileEntry, DiskUsage (mirrors Rust)
│       └── utils/
│           └── format.ts         # formatFileSize, formatDate
├── tests/
│   └── e2e/
├── package.json
├── svelte.config.js
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── README.md
└── DEVELOPMENT.md
```

---

## Key Dependencies

### Rust (Cargo.toml)
- `tauri = "2.0"`, `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-shell`
- `notify = "8"` - cross-platform FS watching
- `trash = "5"` - cross-platform recycle bin
- `fs_extra = "1.3"` - recursive copy/move with progress
- `serde`, `tokio`, `thiserror`, `chrono`
- Dev: `tempfile`, `tokio-test`

### Node (package.json)
- `@tauri-apps/api ^2.0`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`
- `svelte ^5.0`, `@sveltejs/kit ^2.0`, `@sveltejs/adapter-static`
- `tailwindcss ^3.4`, `autoprefixer`, `postcss`
- Dev: `vitest`, `@testing-library/svelte`, `jsdom`, `@tauri-apps/cli ^2.0`

---

## Keyboard Shortcuts (Far-style)

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
| Insert/Space | Toggle selection |
| Arrow Up/Down | Move cursor |
| Home/End | Cursor to first/last |
| Ctrl+R | Refresh |

---

## Plugin API (TypeScript side)

```typescript
interface PathCommanderPlugin {
  name: string;
  version: string;
  onActivate?(ctx: PluginContext): void;
  onDeactivate?(): void;
  onFileContextMenu?(entries: FileEntry[]): ContextMenuItem[];
  onToolbarExtend?(): ToolbarItem[];
  onBeforeCopy?(sources: string[], dest: string): 'allow' | 'deny';
  onFileOpen?(path: string): boolean; // true = handled
  keybindings?: KeyBinding[];
}
```

Plugins are discovered from a `plugins/` directory, loaded via dynamic `import()`.

## Plugin API (Rust side)

```rust
pub trait BackendPlugin: Send + Sync {
    fn name(&self) -> &str;
    fn on_init(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>>;
    fn on_before_copy(&self, sources: &[&str], dest: &str) -> OperationDecision;
    fn on_custom_command(&self, command: &str, args: &Value) -> Option<Value>;
}
```

Rust plugins are statically compiled in for MVP (registered in `lib.rs`).

---

## Implementation Order

### Phase 1: Scaffolding
1. Initialize Tauri 2.x project with Svelte 5 + TypeScript template
2. Configure SvelteKit with static adapter, SSR disabled
3. Set up Tailwind CSS
4. Configure Vitest
5. Verify `npm run tauri dev` works

### Phase 2: Backend - File Reading
1. `models/file_entry.rs` - FileEntry, FileType, FilePermissions structs
2. `error.rs` - AppError enum with thiserror
3. `commands/fs_read.rs` - `list_directory` (directories-first sort), `get_file_info`
4. Unit tests with `tempfile` crate
5. Register commands, set up capabilities

### Phase 3: Frontend - Dual Pane Display
1. `types/file.ts` - TypeScript types mirroring Rust models
2. `utils/format.ts` - formatFileSize, formatDate (with tests)
3. `stores/panes.svelte.ts` - dual-pane state with Svelte 5 runes
4. `services/tauri-commands.ts` - typed invoke wrappers
5. `FileRow.svelte` + tests
6. `FileList.svelte`, `PathBar.svelte`, `FilePane.svelte`
7. `App.svelte` - dual-pane layout with divider

### Phase 4: Keyboard Navigation
1. `services/keyboard.ts` - key binding manager
2. Arrow keys, Enter, Backspace, Tab, Insert/Space, Home/End
3. Tests for key handler dispatch

### Phase 5: File Operations
1. Backend: `create_directory`, `rename_item`, `delete_items`, `copy_items`, `move_items`
2. Progress events via Tauri `emit()`
3. Frontend: `MkdirDialog`, `ConfirmDialog`, `ProgressDialog`
4. Wire F-keys to operations

### Phase 6: FS Watcher
1. `watcher.rs` - notify-rs watcher with Tauri event emission
2. `commands/fs_watch.rs` - watch/unwatch commands
3. `services/watcher.ts` - listen and auto-refresh panes

### Phase 7: Polish
1. `Toolbar.svelte` - F-key buttons
2. `StatusBar.svelte` - disk usage
3. Hidden files toggle, column sorting
4. Platform-specific testing

### Phase 8: Plugin System
1. TS plugin interface + registry + loader
2. Rust BackendPlugin trait + PluginManager
3. Hook into file operations (before/after)
4. Example plugin

### Phase 9: CI/CD & Docs
1. `.github/workflows/ci.yml` - test on PR
2. `.github/workflows/release.yml` - build binaries on tag
3. `README.md` - usage, screenshots
4. `DEVELOPMENT.md` - build prerequisites per platform, dev setup

---

## Testing Strategy

- **Rust unit tests**: In-module `#[cfg(test)]` with `tempfile` for FS tests. Run: `cd src-tauri && cargo test`
- **Frontend unit tests**: Co-located `.test.ts` files. Vitest + @testing-library/svelte + jsdom. Run: `npm run test:unit`
- **Type checking**: `npm run check` (svelte-check)
- **CI**: Both test suites run on every PR

---

## Design Decisions

1. **SvelteKit + static adapter** - proper build tooling, future multi-window routing
2. **Svelte 5 runes** (`$state`, `$derived`, `$effect`) - modern reactivity, no legacy stores
3. **notify-rs directly** - more control than tauri-plugin-fs watcher
4. **`trash` crate** - safe delete by default on all platforms
5. **`fs_extra`** - recursive copy/move with progress callbacks
6. **Directories-first sorting** - matches Far/MC convention
7. **All commands async** - non-blocking I/O
8. **Static Rust plugins** - simple for MVP, dynamic loading deferred

---

## Verification

1. `npm run tauri dev` - app launches with dual panes showing home directory
2. Navigate directories with keyboard (Enter, Backspace, arrows)
3. Tab switches active pane
4. F7 creates directory, F2 renames, F8 deletes, F5 copies, F6 moves
5. `cd src-tauri && cargo test` - all Rust tests pass
6. `npm run test:unit` - all frontend tests pass
7. `npm run tauri build` - produces platform binary
