use printpdf::*;
use super::Component;

pub struct Table {
    pub column_widths: Vec<f32>,
    pub row_height: f32,
    pub header: Option<Vec<Box <dyn Component>>>,
    pub rows: Vec<Vec<Box<dyn Component>>>
}

impl Table {
    fn render_row_at(&self, values: &Vec<Box<dyn Component>>, x: f32, y:f32, layer: &PdfLayerReference) {
        let mut current_x_offset = x;
        for (column_value, column_width) in values.iter().zip(self.column_widths.iter()) {
            column_value.render_at(current_x_offset, y, layer);
            current_x_offset = current_x_offset + column_width;
        }
    }

    fn render_bottom_border_at(&self, x: f32, y:f32, layer: &PdfLayerReference) {
        let total_width: f32 = self.column_widths.iter().sum();
        layer.set_outline_thickness(0.4);
        layer.add_line(
            Line {
                points: vec![
                    (Point::new(Mm(x), Mm(y)), false),
                    (Point::new(Mm(x + total_width), Mm(y)), false),
                ],
                is_closed: false
            }
        );
    }
}

impl Component for Table {

    fn render_at(&self, x: f32, y:f32, layer: &PdfLayerReference) {
        let mut current_y_offset = y;
        if let Some(header_values) = &self.header {
            self.render_row_at(header_values, x, current_y_offset, layer);
            self.render_bottom_border_at(x, current_y_offset - self.row_height / 2.0 , layer);
            current_y_offset = current_y_offset - self.row_height - self.row_height / 2.0;
        }
        for row in self.rows.iter() {
            self.render_row_at(row, x, current_y_offset, layer);
            current_y_offset = current_y_offset - self.row_height;
        }
    }
}