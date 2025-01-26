use printpdf::PdfLayerReference;

pub mod label;
pub mod table;

pub trait Component {
    fn render_at(&self, x: f32, y:f32,  layer: &PdfLayerReference);
}