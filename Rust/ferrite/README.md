# Ferrite - A Lightweight Terminal Emulator

Ferrite is a modern, lightweight terminal emulator written in Rust, designed to be fast, reliable, and customizable. It provides a clean, minimalistic interface while supporting advanced features like multiple tabs, customizable themes, and keyboard shortcuts.

## Features

- **Multiple Tabs**: Open and manage multiple terminal sessions
- **Cross-Platform**: Supports Linux and macOS
- **Customizable**: Themes, fonts, and keyboard shortcuts
- **Lightweight**: Fast startup and low resource usage
- **Reliable**: Robust error handling and process management
- **Extensible**: Designed for future plugin support

## Keyboard Shortcuts

### Linux
- `Ctrl + Shift + T` - Open new tab
- `Ctrl + Shift + W` - Close current tab
- `Shift + Left Arrow` - Move to previous tab
- `Shift + Right Arrow` - Move to next tab

### macOS
- `Cmd + Shift + T` - Open new tab
- `Cmd + Shift + W` - Close current tab
- `Shift + Left Arrow` - Move to previous tab
- `Shift + Right Arrow` - Move to next tab

## Installation

### Prerequisites

- Rust 1.70 or later
- Cargo (Rust's package manager)

### Building from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ferrite.git
cd ferrite
```

2. Build the project:
```bash
cargo build --release
```

3. Run the application:
```bash
cargo run --release
```

## Configuration

Ferrite stores its configuration in:
- Linux: `~/.config/ferrite/config.toml`
- macOS: `~/Library/Application Support/ferrite/config.toml`

### Default Configuration

```toml
shell = "/bin/bash"
tab_count = 1

[theme]
name = "Default"
background = [255, 255, 255]  # White
foreground = [0, 0, 0]        # Black
cursor = [0, 0, 0]            # Black
selection = [200, 200, 200]   # Light gray

[font]
family = "Hack"
size = 10.0
bold = false
italic = false

[shortcuts]
new_tab = "Ctrl+Shift+T"
close_tab = "Ctrl+Shift+W"
next_tab = "Shift+Right"
prev_tab = "Shift+Left"
```

## Architecture

Ferrite is built with a modular architecture:

- **`app.rs`**: Main application logic and GUI loop
- **`config.rs`**: Configuration management
- **`shell.rs`**: Shell process management
- **`terminal.rs`**: Terminal emulation (VTE parsing)
- **`ui.rs`**: User interface components
- **`utils.rs`**: Utility functions

### Key Components

1. **Terminal Emulation**: Uses the `vte` crate for ANSI escape sequence parsing
2. **GUI Framework**: Built with `egui` for cross-platform compatibility
3. **Shell Integration**: Asynchronous process management with `tokio`
4. **Configuration**: TOML-based configuration with automatic loading/saving

## Development

### Running Tests

```bash
cargo test
```

### Code Style

This project follows Rust's standard formatting:

```bash
cargo fmt
cargo clippy
```

### Project Structure

```
ferrite/
├── src/
│   ├── main.rs          # Application entry point
│   ├── app.rs           # Main application logic
│   ├── config.rs        # Configuration management
│   ├── shell.rs         # Shell process management
│   ├── terminal.rs      # Terminal emulation
│   ├── ui.rs            # User interface
│   └── utils.rs         # Utility functions
├── Cargo.toml           # Dependencies and metadata
└── README.md           # This file
```

## Design Principles

- **Lightweight**: Minimal resource usage and fast startup
- **Reliable**: Robust error handling and graceful degradation
- **Minimalistic**: Clean, uncluttered interface
- **Customizable**: Extensive theming and configuration options
- **Extensible**: Plugin architecture for future enhancements

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [egui](https://github.com/emilk/egui) - Immediate mode GUI framework
- [vte](https://github.com/alacritty/vte) - Terminal emulation library
- [tokio](https://tokio.rs/) - Asynchronous runtime

## Roadmap

- [ ] Plugin system for custom functionality
- [ ] Session persistence
- [ ] Split panes
- [ ] Search functionality
- [ ] Copy/paste improvements
- [ ] More theme options
- [ ] Performance optimizations 