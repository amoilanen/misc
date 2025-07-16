use std::collections::VecDeque;
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct Cell {
    pub character: char,
    pub foreground: [u8; 3],
    pub background: [u8; 3],
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            character: ' ',
            foreground: [0, 0, 0],
            background: [255, 255, 255],
            bold: false,
            italic: false,
            underline: false,
        }
    }
}

pub struct Terminal {
    pub width: usize,
    pub height: usize,
    pub cursor_x: usize,
    pub cursor_y: usize,
    pub cells: Vec<Vec<Cell>>,
    pub scrollback: VecDeque<Vec<Cell>>,
    pub scrollback_size: usize,
    pub current_foreground: [u8; 3],
    pub current_background: [u8; 3],
    pub current_attributes: u8,
}

impl Terminal {
    pub fn new(width: usize, height: usize) -> Self {
        let cells = vec![vec![Cell::default(); width]; height];
        
        Self {
            width,
            height,
            cursor_x: 0,
            cursor_y: 0,
            cells,
            scrollback: VecDeque::new(),
            scrollback_size: 1000,
            current_foreground: [0, 0, 0],
            current_background: [255, 255, 255],
            current_attributes: 0,
        }
    }

    pub fn resize(&mut self, width: usize, height: usize) {
        self.width = width;
        self.height = height;
        
        // Resize cells
        self.cells = vec![vec![Cell::default(); width]; height];
        
        // Ensure cursor is within bounds
        self.cursor_x = self.cursor_x.min(width.saturating_sub(1));
        self.cursor_y = self.cursor_y.min(height.saturating_sub(1));
    }

    pub fn write(&mut self, data: &[u8]) {
        for &byte in data {
            self.handle_byte(byte);
        }
    }

    fn handle_byte(&mut self, byte: u8) {
        match byte {
            b'\n' => {
                self.cursor_y += 1;
                if self.cursor_y >= self.height {
                    self.scroll_up();
                    self.cursor_y = self.height - 1;
                }
            }
            b'\r' => {
                self.cursor_x = 0;
            }
            b'\t' => {
                self.cursor_x = (self.cursor_x + 8) & !7;
            }
            b'\x08' => { // Backspace
                if self.cursor_x > 0 {
                    self.cursor_x -= 1;
                }
            }
            _ => {
                if byte.is_ascii() && !byte.is_ascii_control() {
                    self.print_char(byte as char);
                }
            }
        }
    }

    fn print_char(&mut self, c: char) {
        if self.cursor_x < self.width && self.cursor_y < self.height {
            let mut cell = Cell::default();
            cell.character = c;
            cell.foreground = self.current_foreground;
            cell.background = self.current_background;
            cell.bold = (self.current_attributes & 1) != 0;
            cell.italic = (self.current_attributes & 2) != 0;
            cell.underline = (self.current_attributes & 4) != 0;
            
            self.cells[self.cursor_y][self.cursor_x] = cell;
            self.cursor_x += 1;
        }
    }

    pub fn get_cell(&self, x: usize, y: usize) -> Option<&Cell> {
        if y < self.cells.len() && x < self.cells[y].len() {
            Some(&self.cells[y][x])
        } else {
            None
        }
    }

    pub fn set_cell(&mut self, x: usize, y: usize, cell: Cell) {
        if y < self.cells.len() && x < self.cells[y].len() {
            self.cells[y][x] = cell;
        }
    }

    pub fn clear_screen(&mut self) {
        for row in &mut self.cells {
            for cell in row {
                *cell = Cell::default();
            }
        }
        self.cursor_x = 0;
        self.cursor_y = 0;
    }

    pub fn clear_line(&mut self) {
        if self.cursor_y < self.cells.len() {
            for x in self.cursor_x..self.width {
                self.cells[self.cursor_y][x] = Cell::default();
            }
        }
    }

    pub fn scroll_up(&mut self) {
        if let Some(top_line) = self.cells.first().cloned() {
            self.scrollback.push_back(top_line);
            if self.scrollback.len() > self.scrollback_size {
                self.scrollback.pop_front();
            }
        }
        
        self.cells.rotate_left(1);
        if let Some(last_row) = self.cells.last_mut() {
            for cell in last_row.iter_mut() {
                *cell = Cell::default();
            }
        }
    }

    pub fn scroll_down(&mut self) {
        if let Some(bottom_line) = self.scrollback.pop_back() {
            self.cells.rotate_right(1);
            if let Some(first_row) = self.cells.first_mut() {
                *first_row = bottom_line;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_terminal_creation() {
        let terminal = Terminal::new(80, 24);
        assert_eq!(terminal.width, 80);
        assert_eq!(terminal.height, 24);
        assert_eq!(terminal.cursor_x, 0);
        assert_eq!(terminal.cursor_y, 0);
    }

    #[test]
    fn test_terminal_resize() {
        let mut terminal = Terminal::new(80, 24);
        terminal.resize(100, 30);
        assert_eq!(terminal.width, 100);
        assert_eq!(terminal.height, 30);
    }

    #[test]
    fn test_terminal_print() {
        let mut terminal = Terminal::new(80, 24);
        terminal.write(b"Hello");
        assert_eq!(terminal.cursor_x, 5);
        assert_eq!(terminal.cursor_y, 0);
        
        let cell = terminal.get_cell(0, 0).unwrap();
        assert_eq!(cell.character, 'H');
    }

    #[test]
    fn test_terminal_clear_screen() {
        let mut terminal = Terminal::new(80, 24);
        terminal.write(b"Hello");
        terminal.clear_screen();
        assert_eq!(terminal.cursor_x, 0);
        assert_eq!(terminal.cursor_y, 0);
        
        let cell = terminal.get_cell(0, 0).unwrap();
        assert_eq!(cell.character, ' ');
    }
} 