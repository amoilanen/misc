use printpdf::*;
use super::Component;

pub struct Table {
    pub column_widths: Vec<f32>,
    pub row_height: f32,
    pub rows: Vec<Vec<Box<dyn Component>>>
}

impl Component for Table {
    fn render_at(&self, x: f32, y:f32,  layer: &PdfLayerReference) {
        let mut current_y_offset = y;
        for row in self.rows.iter() {
            let mut current_x_offset = x;
            for (column_value, column_width) in row.iter().zip(self.column_widths.iter()) {
                column_value.render_at(current_x_offset, current_y_offset, layer);
                current_x_offset = current_x_offset + column_width;
            }
            current_y_offset = current_y_offset - self.row_height;
        }
    }
}