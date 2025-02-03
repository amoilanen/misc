use anyhow::{ Context, Error };
use std::fs;
use std::fs::File;
use std::io::BufWriter;
use invoice_generator::renderer::render;
use invoice_generator::invoice::Invoice;

fn main() -> Result<(), Error> {
    let raw_invoice = fs::read_to_string("examples/1.json")?;
    let invoice: Invoice = serde_json::from_str(&raw_invoice).context("Could not parse invoice")?;
    let doc = render(&invoice)?;
    doc.save(&mut BufWriter::new(File::create(format!("{}.pdf", invoice.invoice_number)).unwrap())).unwrap();
    Ok(())
}