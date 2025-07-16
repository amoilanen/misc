use egui::{Ui, Color32, FontId, Key, Response, Sense, Vec2, Pos2, Rect};
use std::sync::{Arc, Mutex};
use crate::terminal::Terminal;
use crate::config::{Config, Theme, Font};
use crate::shell::Shell;
use anyhow::Result;
use tracing::debug;

pub struct Tab {
    pub id: usize,
    pub title: String,
    pub terminal: Arc<Mutex<Terminal>>,
    pub shell: Arc<Mutex<Shell>>,
    pub active: bool,
}

impl Tab {
    pub fn new(id: usize, shell_path: &str, spawn_tasks: bool) -> Result<Self> {
        let terminal = Arc::new(Mutex::new(Terminal::new(80, 24)));
        let shell = Arc::new(Mutex::new(Shell::new(shell_path, spawn_tasks)?));
        
        Ok(Self {
            id,
            title: format!("Terminal {}", id + 1),
            terminal,
            shell,
            active: false,
        })
    }

    pub fn update(&mut self) -> Result<()> {
        // For now, we'll handle shell output in the main app loop
        // This is a simplified approach that works with the current architecture
        Ok(())
    }

    pub fn write_input(&self, data: Vec<u8>) -> Result<()> {
        let mut shell = self.shell.lock().unwrap();
        shell.write(data)
    }
    
    pub fn read_output(&mut self) -> Result<()> {
        // Try to read output from shell and update terminal
        if let Ok(mut shell) = self.shell.try_lock() {
            let output = shell.read_output();
            if !output.is_empty() {
                if let Ok(mut terminal) = self.terminal.lock() {
                    terminal.write(&output);
                }
            }
        }
        Ok(())
    }
}

pub struct TerminalWidget {
    pub terminal: Arc<Mutex<Terminal>>,
    pub font_size: f32,
    pub cell_size: Vec2,
    pub focused: bool,
}

impl TerminalWidget {
    pub fn new(terminal: Arc<Mutex<Terminal>>, font_size: f32) -> Self {
        Self {
            terminal,
            font_size,
            cell_size: Vec2::new(font_size * 0.6, font_size * 1.2),
            focused: false,
        }
    }

    pub fn show(&mut self, ui: &mut Ui, theme: &Theme, font: &Font) -> Response {
        // Calculate available space and determine terminal size
        let available_size = ui.available_size();
        let cell_size = self.cell_size;
        
        // Calculate how many cells we can fit
        let cols = (available_size.x / cell_size.x).floor() as usize;
        let rows = (available_size.y / cell_size.y).floor() as usize;
        
        // Ensure minimum size
        let cols = cols.max(10);
        let rows = rows.max(5);
        
        // Resize terminal if needed
        {
            let mut terminal = self.terminal.lock().unwrap();
            if terminal.width != cols || terminal.height != rows {
                terminal.resize(cols, rows);
            }
        }
        
        // Allocate the full available space
        let (response, painter) = ui.allocate_painter(available_size, Sense::click_and_drag());
        
        // Handle focus
        if response.clicked() {
            self.focused = true;
            ui.memory_mut(|mem| mem.request_focus(response.id));
        }
        
        if ui.input(|i| i.key_pressed(Key::Tab)) {
            ui.memory_mut(|mem| mem.surrender_focus(response.id));
            self.focused = false;
        }
        
        // Check if we have focus
        self.focused = ui.memory(|mem| mem.has_focus(response.id));
        
        // Draw background
        painter.rect_filled(
            response.rect,
            0.0,
            Color32::from_rgb(theme.background[0], theme.background[1], theme.background[2]),
        );

        // Draw cells
        let font_id = FontId::proportional(font.size);
        let terminal = self.terminal.lock().unwrap();
        
        for y in 0..terminal.height {
            for x in 0..terminal.width {
                if let Some(cell) = terminal.get_cell(x, y) {
                    let pos = Vec2::new(
                        response.rect.min.x + x as f32 * cell_size.x,
                        response.rect.min.y + y as f32 * cell_size.y,
                    );

                    // Draw cell background
                    painter.rect_filled(
                        Rect::from_min_size(
                            Pos2::new(pos.x, pos.y),
                            cell_size,
                        ),
                        0.0,
                        Color32::from_rgb(cell.background[0], cell.background[1], cell.background[2]),
                    );

                    // Draw character
                    if cell.character != ' ' {
                        let text_color = Color32::from_rgb(
                            cell.foreground[0],
                            cell.foreground[1],
                            cell.foreground[2],
                        );

                        let mut font_id = font_id.clone();
                        if cell.bold {
                            font_id.size *= 1.1;
                        }
                        if cell.italic {
                            // Note: egui doesn't support italic directly, but we can simulate it
                        }

                        painter.text(
                            Pos2::new(pos.x + 2.0, pos.y + cell_size.y - 2.0),
                            egui::Align2::LEFT_TOP,
                            cell.character.to_string(),
                            font_id,
                            text_color,
                        );
                    }
                }
            }
        }

        // Draw cursor if focused
        if self.focused {
            let cursor_pos = Vec2::new(
                response.rect.min.x + terminal.cursor_x as f32 * cell_size.x,
                response.rect.min.y + terminal.cursor_y as f32 * cell_size.y,
            );

            painter.rect_stroke(
                Rect::from_min_size(Pos2::new(cursor_pos.x, cursor_pos.y), cell_size),
                0.0,
                (2.0, Color32::from_rgb(theme.cursor[0], theme.cursor[1], theme.cursor[2])),
            );
        }

        response
    }
    
    pub fn is_focused(&self) -> bool {
        self.focused
    }
}

pub struct TabBar {
    pub tabs: Vec<Tab>,
    pub active_tab: usize,
}

impl TabBar {
    pub fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active_tab: 0,
        }
    }

    pub fn add_tab(&mut self, shell_path: &str, spawn_tasks: bool) -> Result<()> {
        let id = self.tabs.len();
        let mut tab = Tab::new(id, shell_path, spawn_tasks)?;
        tab.active = true;
        
        // Deactivate other tabs
        for other_tab in &mut self.tabs {
            other_tab.active = false;
        }
        
        self.tabs.push(tab);
        self.active_tab = id;
        Ok(())
    }

    pub fn remove_tab(&mut self, index: usize) -> Result<()> {
        if self.tabs.len() > 1 {
            self.tabs.remove(index);
            
            // Update active tab
            if self.active_tab >= index && self.active_tab > 0 {
                self.active_tab -= 1;
            }
            
            // Activate the new active tab
            if let Some(tab) = self.tabs.get_mut(self.active_tab) {
                tab.active = true;
            }
        }
        Ok(())
    }

    pub fn next_tab(&mut self) {
        if !self.tabs.is_empty() {
            self.tabs[self.active_tab].active = false;
            self.active_tab = (self.active_tab + 1) % self.tabs.len();
            self.tabs[self.active_tab].active = true;
        }
    }

    pub fn prev_tab(&mut self) {
        if !self.tabs.is_empty() {
            self.tabs[self.active_tab].active = false;
            self.active_tab = if self.active_tab == 0 {
                self.tabs.len() - 1
            } else {
                self.active_tab - 1
            };
            self.tabs[self.active_tab].active = true;
        }
    }

    pub fn show(&mut self, ui: &mut Ui) -> Response {
        let mut response = ui.allocate_response(Vec2::ZERO, Sense::click());
        
        ui.horizontal(|ui| {
            let mut active_index = None;
            
            for (i, tab) in self.tabs.iter_mut().enumerate() {
                let mut text = tab.title.clone();
                if tab.active {
                    text = format!("▶ {}", text);
                }
                
                let button_response = ui.button(text);
                if button_response.clicked() {
                    active_index = Some(i);
                }
                
                response = response.union(button_response);
            }
            
            // Handle tab activation outside the loop
            if let Some(i) = active_index {
                for (j, tab) in self.tabs.iter_mut().enumerate() {
                    tab.active = j == i;
                }
                self.active_tab = i;
            }
        });
        
        response
    }

    pub fn get_active_tab(&mut self) -> Option<&mut Tab> {
        self.tabs.get_mut(self.active_tab)
    }
}

pub struct SettingsDialog {
    pub open: bool,
    pub config: Config,
}

impl SettingsDialog {
    pub fn new(config: Config) -> Self {
        Self {
            open: false,
            config,
        }
    }

    pub fn show(&mut self, ui: &mut Ui) -> bool {
        if !self.open {
            return false;
        }

        let mut changed = false;
        
        // Simple settings dialog for now
        ui.heading("Terminal Settings");
        
        // Shell selection
        ui.label("Default Shell:");
        if ui.text_edit_singleline(&mut self.config.shell).changed() {
            changed = true;
        }
        
        // Font settings
        ui.label("Font Family:");
        if ui.text_edit_singleline(&mut self.config.font.family).changed() {
            changed = true;
        }
        
        ui.label("Font Size:");
        if ui.add(egui::Slider::new(&mut self.config.font.size, 8.0..=24.0)).changed() {
            changed = true;
        }
        
        // Save button
        if ui.button("Save").clicked() {
            if let Err(e) = self.config.save() {
                debug!("Failed to save config: {}", e);
            }
            self.open = false;
        }
        
        changed
    }
}

pub fn handle_keyboard_input(
    input: &egui::InputState,
    tab_bar: &mut TabBar,
    config: &Config,
) -> bool {
    let mut handled = false;
    
    // Check for shortcuts
    if input.key_pressed(Key::T) && input.modifiers.ctrl && input.modifiers.shift {
        if let Err(e) = tab_bar.add_tab(config.get_shell(), true) {
            debug!("Failed to add tab: {}", e);
        }
        handled = true;
    }
    
    if input.key_pressed(Key::W) && input.modifiers.ctrl && input.modifiers.shift {
        if let Err(e) = tab_bar.remove_tab(tab_bar.active_tab) {
            debug!("Failed to remove tab: {}", e);
        }
        handled = true;
    }
    
    if input.key_pressed(Key::ArrowRight) && input.modifiers.shift {
        tab_bar.next_tab();
        handled = true;
    }
    
    if input.key_pressed(Key::ArrowLeft) && input.modifiers.shift {
        tab_bar.prev_tab();
        handled = true;
    }
    
    handled
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tab_creation() {
        let tab = Tab::new(0, "/bin/sh", false);
        assert!(tab.is_ok());
    }

    #[tokio::test]
    async fn test_tab_bar() {
        let mut tab_bar = TabBar::new();
        assert!(tab_bar.tabs.is_empty());
        let result = tab_bar.add_tab("/bin/sh", false);
        assert!(result.is_ok());
        assert_eq!(tab_bar.tabs.len(), 1);
    }

    #[tokio::test]
    async fn test_tab_navigation() {
        let mut tab_bar = TabBar::new();
        tab_bar.add_tab("/bin/sh", false).unwrap();
        tab_bar.add_tab("/bin/bash", false).unwrap();
        assert_eq!(tab_bar.active_tab, 1);
        tab_bar.prev_tab();
        assert_eq!(tab_bar.active_tab, 0);
        tab_bar.next_tab();
        assert_eq!(tab_bar.active_tab, 1);
    }
} 