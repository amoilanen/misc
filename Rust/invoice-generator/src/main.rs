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
        invoice_number: "2025-0001".to_owned(),
        reference_id: Some("4387349".to_owned()),
        description: Some("Tietokonen huolto ja päivitys".to_owned()),
        invoice_lines: vec![InvoiceLine {
            name: "Tietokone palvelut".to_owned(),
            count: 1,
            price: BigDecimal::from_f32(89.99).unwrap()
        }]
    };

    let (doc, page1, layer1) = PdfDocument::new(format!("Lasku {}", invoice.invoice_number), Mm(210.0), Mm(297.0), "Layer 1");

    let font = BuiltinFont::Helvetica;
    let font_ref = doc.add_builtin_font(font).unwrap();

    let current_layer = doc.get_page(page1).get_layer(layer1);
    // Add title text
    current_layer.use_text(
        "Lasku",
        24.0,
        Mm(140.0),
        Mm(270.0),
        &font_ref,
    );

    current_layer.use_text(
        invoice.billed_to.name,
        12.0,
        Mm(20.0),
        Mm(250.0),
        &font_ref,
    );
    current_layer.use_text(
        invoice.billed_to.address_line_1,
        12.0,
        Mm(20.0),
        Mm(245.0),
        &font_ref,
    );
    if let Some(address_line_2) = invoice.billed_to.address_line_2 {
        current_layer.use_text(
            address_line_2,
            12.0,
            Mm(20.0),
            Mm(240.0),
            &font_ref,
        );
    }
    if let Some(address_line_3) = invoice.billed_to.address_line_3 {
        current_layer.use_text(
            address_line_3,
            12.0,
            Mm(20.0),
            Mm(235.0),
            &font_ref,
        );
    }

    current_layer.add_line(
        Line {
            points: vec![
                (Point::new(Mm(10.0), Mm(190.0)), false),
                (Point::new(Mm(200.0), Mm(190.0)), false),
            ],
            is_closed: false
            //line_width: Some(Mm(0.5))
        },
    );

    //TODO: Render the billed_by section
    //TODO: Render the invoice information: invoice number, reference id (if present) and other relevant information

    doc.save(&mut BufWriter::new(File::create("test_invoice.pdf").unwrap())).unwrap();
}