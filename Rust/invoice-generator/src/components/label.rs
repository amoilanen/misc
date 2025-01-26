use printpdf::*;
use super::Component;

pub struct Label {
    pub value: String,
    pub font: IndirectFontRef,
    pub font_size: f32
}

impl Label {
    pub fn new(value: &str, font_size: f32, font: IndirectFontRef) -> Label {
        Label {
            value: value.to_owned(),
            font,
            font_size
        }
    }
 
    pub fn new_rows(rows: Vec<Vec<&str>>, font_size: f32, font: &IndirectFontRef) -> Vec<Vec<Box<dyn Component>>> {
        let mut labels: Vec<Vec<Box<dyn Component>>> = Vec::new();
        for row in rows.into_iter() {
            let mut label_row: Vec<Box<dyn Component>> = Vec::new();
            for value in row.into_iter() {
                label_row.push(Box::new(Label::new(value, font_size, font.clone())));
            }
            labels.push(label_row);
        }
        labels
    }
}

impl Component for Label {
    fn render_at(&self, x: f32, y:f32,  layer: &PdfLayerReference) {
        layer.use_text(
            &self.value,
            self.font_size,
            Mm(x),
            Mm(y),
            &self.font,
        );
    }
}