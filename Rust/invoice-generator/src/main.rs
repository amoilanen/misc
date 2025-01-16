use printpdf::*;
use bigdecimal::{BigDecimal, FromPrimitive};
use std::fs::File;
use std::io::BufWriter;

struct BillingAddress {
    name: String,
    email: Option<String>,
    address_line_1: String,
    address_line_2: Option<String>,
    address_line_3: Option<String>,
}

struct InvoiceLine {
    name: String,
    count: usize,
    price: BigDecimal
}

struct Invoice {
    billed_to: BillingAddress,
    billed_by: BillingAddress,
    currency: String,
    vat_percent: f32,
    billed_at: String,
    invoice_number: String,
    reference_id: Option<String>,
    description: Option<String>,
    invoice_lines: Vec<InvoiceLine>
}

fn main() {
    let invoice = Invoice {
        billed_by: BillingAddress {
            name: "Aino Solutions".to_owned(),
            email: Some("info@aino.solutions.fi".to_owned()),
            address_line_1: "Mäntykatu 7B".to_owned(),
            address_line_2: Some("00500 Helsinki".to_owned()),
            address_line_3: None
        },
        billed_to: BillingAddress {
            name: "Matti Meikäläinen".to_owned(),
            email: Some("matti.kari.meikäläinen@gmail.com".to_owned()),
            address_line_1: "Kirkkotie 21".to_owned(),
            address_line_2: Some("96100 Rovaniemi".to_owned()),
            address_line_3: None
        },
        currency: "EUR".to_owned(),
        vat_percent: 25.5,
        billed_at: "17.01.2025".to_owned(),
        invoice_number: "2025-0001".to_owned(),
        reference_id: Some("4387349".to_owned()),
        description: Some("Tietokonen huolto ja päivitys".to_owned()),
        invoice_lines: vec![InvoiceLine {
            name: "Tietokone palvelut (työ)".to_owned(),
            count: 1,
            price: BigDecimal::from_f32(89.99).unwrap()
        }, InvoiceLine {
            name: "CD levyt".to_owned(),
            count: 5,
            price: BigDecimal::from_f32(35.00).unwrap()
        }, InvoiceLine {
            name: "Matkakulut".to_owned(),
            count: 1,
            price: BigDecimal::from_f32(12.00).unwrap()
        }]
    };

    let (doc, page1, layer1) = PdfDocument::new(format!("Lasku {}", invoice.invoice_number), Mm(210.0), Mm(297.0), "Layer 1");

    let regular_font = BuiltinFont::Helvetica;
    let regular_font_ref = doc.add_builtin_font(regular_font).unwrap();
    let bold_font = BuiltinFont::HelveticaBold;
    let bold_font_ref = doc.add_builtin_font(bold_font).unwrap();

    let current_layer = doc.get_page(page1).get_layer(layer1);
    current_layer.use_text(
        "Lasku",
        24.0,
        Mm(140.0),
        Mm(270.0),
        &regular_font_ref,
    );
    //TODO: Render the billed_by section
    // - Render the invoice information: invoice number, reference id (if present) and other relevant information

    // Billed to section
    current_layer.use_text(
        invoice.billed_to.name,
        12.0,
        Mm(20.0),
        Mm(250.0),
        &regular_font_ref,
    );
    current_layer.use_text(
        invoice.billed_to.address_line_1,
        12.0,
        Mm(20.0),
        Mm(245.0),
        &regular_font_ref,
    );
    if let Some(address_line_2) = invoice.billed_to.address_line_2 {
        current_layer.use_text(
            address_line_2,
            12.0,
            Mm(20.0),
            Mm(240.0),
            &regular_font_ref,
        );
    }
    if let Some(address_line_3) = invoice.billed_to.address_line_3 {
        current_layer.use_text(
            address_line_3,
            12.0,
            Mm(20.0),
            Mm(235.0),
            &regular_font_ref,
        );
    }

    // Table headers
    current_layer.set_outline_thickness(0.4);
    current_layer.add_line(
        Line {
            points: vec![
                (Point::new(Mm(15.0), Mm(190.0)), false),
                (Point::new(Mm(195.0), Mm(190.0)), false),
            ],
            is_closed: false
        },
    );
    current_layer.use_text(
        "Tuote",
        10.0,
        Mm(15.0),
        Mm(192.0),
        &bold_font_ref,
    );
    current_layer.use_text(
        "Määrä",
        10.0,
        Mm(75.0),
        Mm(192.0),
        &bold_font_ref,
    );
    current_layer.use_text(
        "Hinta (sis. ALV)",
        10.0,
        Mm(105.0),
        Mm(192.0),
        &bold_font_ref,
    );
    current_layer.use_text(
        "Veroton hinta",
        10.0,
        Mm(135.0),
        Mm(192.0),
        &bold_font_ref,
    );
    current_layer.use_text(
        "ALV %",
        10.0,
        Mm(183.0),
        Mm(192.0),
        &bold_font_ref,
    );

    //TODO: Render the invoice lines in a table

    //TODO: Render the summary: total price without VAT, total VAT, total price

    doc.save(&mut BufWriter::new(File::create("test_invoice.pdf").unwrap())).unwrap();
}