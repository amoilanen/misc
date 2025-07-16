use eframe::{App, Frame};
use egui::{Context, Key};
use tokio::runtime::Runtime;
use anyhow::Result;
use tracing::info;

use crate::config::Config;
use crate::ui::{TabBar, TerminalWidget, SettingsDialog, handle_keyboard_input};

pub struct FerriteApp {
    config: Config,
    tab_bar: TabBar,
    settings_dialog: SettingsDialog,
    runtime: Runtime,
    input_buffer: Vec<u8>,
    spawn_tasks: bool,
    terminal_widget: Option<TerminalWidget>,
}

impl FerriteApp {
    pub fn new_with_spawn(config: Config, spawn_tasks: bool) -> Result<Self> {
        let mut tab_bar = TabBar::new();
        tab_bar.add_tab(config.get_shell(), spawn_tasks)?;
        let settings_dialog = SettingsDialog::new(config.clone());
        let runtime = Runtime::new()?;
        Ok(Self {
            config,
            tab_bar,
            settings_dialog,
            runtime,
            input_buffer: Vec::new(),
            spawn_tasks,
            terminal_widget: None,
        })
    }
    
    pub fn new() -> Result<Self> {
        let config = Config::load()?;
        Self::new_with_spawn(config, true)
    }

    fn handle_input(&mut self, ctx: &Context) {
        let input = ctx.input(|i| i.clone());
        
        // Handle keyboard shortcuts
        if handle_keyboard_input(&input, &mut self.tab_bar, &self.config) {
            return;
        }
        
        // Handle regular input only if terminal widget is focused
        if let Some(widget) = &mut self.terminal_widget {
            if widget.is_focused() {
                if let Some(active_tab) = self.tab_bar.get_active_tab() {
                    // Handle text input
                    for event in &input.events {
                        match event {
                            egui::Event::Text(text) => {
                                // Convert text to bytes and send to shell
                                let bytes = text.as_bytes().to_vec();
                                if let Err(e) = active_tab.write_input(bytes) {
                                    info!("Failed to write input: {}", e);
                                }
                            }
                            egui::Event::Key { key, pressed, modifiers, .. } => {
                                if *pressed {
                                    match key {
                                        Key::Enter => {
                                            if let Err(e) = active_tab.write_input(vec![b'\n']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::Backspace => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x08']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::Escape => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x1b']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::Tab => {
                                            if let Err(e) = active_tab.write_input(vec![b'\t']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::ArrowUp => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x1b', b'[', b'A']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::ArrowDown => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x1b', b'[', b'B']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::ArrowLeft => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x1b', b'[', b'D']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        Key::ArrowRight => {
                                            if let Err(e) = active_tab.write_input(vec![b'\x1b', b'[', b'C']) {
                                                info!("Failed to write input: {}", e);
                                            }
                                        }
                                        _ => {
                                            // Handle other keys if needed
                                        }
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    fn update_tabs(&mut self) {
        for tab in &mut self.tab_bar.tabs {
            if let Err(e) = tab.update() {
                info!("Failed to update tab: {}", e);
            }
            // Read output from shell and update terminal
            if let Err(e) = tab.read_output() {
                info!("Failed to read shell output: {}", e);
            }
        }
    }
}

impl App for FerriteApp {
    fn update(&mut self, ctx: &Context, _frame: &mut Frame) {
        // Handle input
        self.handle_input(ctx);
        
        // Update tabs
        self.update_tabs();
        
        // Main UI
        egui::CentralPanel::default().show(ctx, |ui| {
            // Menu bar
            egui::TopBottomPanel::top("menu").show(ctx, |ui| {
                ui.horizontal(|ui| {
                    if ui.button("File").clicked() {
                        // File menu
                    }
                    if ui.button("Edit").clicked() {
                        // Edit menu
                    }
                    if ui.button("Settings").clicked() {
                        self.settings_dialog.open = true;
                    }
                    if ui.button("Help").clicked() {
                        // Help menu
                    }
                });
            });
            
            // Tab bar
            egui::TopBottomPanel::top("tabs").show(ctx, |ui| {
                self.tab_bar.show(ui);
            });
            
            // Terminal area
            egui::CentralPanel::default().show(ctx, |ui| {
                if let Some(active_tab) = self.tab_bar.get_active_tab() {
                    let terminal = active_tab.terminal.clone();
                    let mut widget = TerminalWidget::new(terminal, self.config.get_font().size);
                    widget.show(ui, self.config.get_theme(), self.config.get_font());
                    
                    // Store widget reference for input handling
                    self.terminal_widget = Some(widget);
                }
            });
        });
        
        // Settings dialog - we'll handle this differently for now
        if self.settings_dialog.open {
            // TODO: Implement settings dialog properly
        }
        
        // Request continuous updates
        ctx.request_repaint();
    }

    fn on_exit(&mut self, _gl: std::option::Option<&eframe::glow::Context>) {
        info!("Ferrite terminal emulator shutting down");
        
        // Save configuration
        if let Err(e) = self.config.save() {
            info!("Failed to save configuration: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_app_creation() {
        let config = Config::default();
        let app = FerriteApp::new_with_spawn(config, false);
        assert!(app.is_ok());
    }
} 