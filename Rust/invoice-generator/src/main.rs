use printpdf::*;
use bigdecimal::{BigDecimal, FromPrimitive};
use std::fs::File;
use std::io::BufWriter;
use invoice_generator::format::{format_price, format_vat};

struct BillingAddress {
    name: String,
    email: Option<String>,
    company_id: Option<String>,
    vat_id: Option<String>,
    phone_number: Option<String>,
    address_line_1: String,
    address_line_2: Option<String>,
    address_line_3: Option<String>,
}

struct InvoiceLine {
    name: String,
    count: usize,
    price: BigDecimal
}

struct BankDetails {
    account_number: String,
    bic_code: String
}

struct Invoice {
    billed_to: BillingAddress,
    billed_by: BillingAddress,
    currency: String,
    vat_percent: f32,
    billed_at: String,
    due_date: String,
    invoice_number: String,
    reference_id: Option<String>,
    description: Option<String>,
    bank_details: BankDetails,
    invoice_lines: Vec<InvoiceLine>
}

fn main() {
    let invoice = Invoice {
        billed_by: BillingAddress {
            name: "Aino Solutions".to_owned(),
            email: Some("info@aino.solutions.fi".to_owned()),
            address_line_1: "Mäntykatu 7B".to_owned(),
            address_line_2: Some("00500 Helsinki".to_owned()),
            address_line_3: None,
            phone_number: Some("0455555555".to_owned()),
            company_id: Some("1234567-8".to_owned()),
            vat_id: Some("FI12345678".to_owned()),
        },
        billed_to: BillingAddress {
            name: "Matti Meikäläinen".to_owned(),
            email: Some("matti.kari.meikäläinen@gmail.com".to_owned()),
            address_line_1: "Kirkkotie 21".to_owned(),
            address_line_2: Some("96100 Rovaniemi".to_owned()),
            address_line_3: None,
            phone_number: None,
            company_id: None,
            vat_id: None,
        },
        bank_details: BankDetails {
            account_number: "FI22 1234 5678 1234 56".to_owned(),
            bic_code: "NDEAFIHH".to_owned()
        },
        currency: "EUR".to_owned(),
        vat_percent: 25.5,
        billed_at: "17.01.2025".to_owned(),
        due_date: "31.01.2025".to_owned(),
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
    //TODO: Render the invoice information: invoice number, reference id (if present) and other relevant information

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

    let mut current_y = 185.0;
    for invoice_line in invoice.invoice_lines.iter() {
        current_layer.use_text(
            &invoice_line.name,
            10.0,
            Mm(15.0),
            Mm(current_y),
            &regular_font_ref,
        );
        current_layer.use_text(
            format!("{}", invoice_line.count),
            10.0,
            Mm(75.0),
            Mm(current_y),
            &regular_font_ref,
        );
        current_layer.use_text(
            format_price(&invoice_line.price, &invoice.currency),
            10.0,
            Mm(105.0),
            Mm(current_y),
            &regular_font_ref,
        );

        let price_without_vat = &invoice_line.price / BigDecimal::from_f32(1.0 + invoice.vat_percent / 100.0).unwrap();
        current_layer.use_text(
            format_price(&price_without_vat, &invoice.currency),
            10.0,
            Mm(135.0),
            Mm(current_y),
            &regular_font_ref,
        );
        current_layer.use_text(
            format_vat(&invoice.vat_percent),
            10.0,
            Mm(187.0),
            Mm(current_y),
            &regular_font_ref,
        );
        current_y = current_y - 5.0;
    }

    let total_price: BigDecimal = invoice.invoice_lines.iter().map(|line| &line.price).sum();
    let total_vat: BigDecimal = BigDecimal::from_f32(invoice.vat_percent / 100.0).unwrap() * &total_price;
    let total_price_without_vat = &total_price / BigDecimal::from_f32(1.0 + invoice.vat_percent / 100.0).unwrap();
    current_y = current_y - 21.0;
    current_layer.use_text(
        "Veroton hinta yhteensä:",
        10.0,
        Mm(125.0),
        Mm(current_y),
        &regular_font_ref,
    );
    current_layer.use_text(
        format_price(&total_price_without_vat, &invoice.currency),
        10.0,
        Mm(165.0),
        Mm(current_y),
        &regular_font_ref,
    );
    current_y = current_y - 5.0;
    current_layer.use_text(
        "Alv 25,5 %:",
        10.0,
        Mm(125.0),
        Mm(current_y),
        &regular_font_ref,
    );
    current_layer.use_text(
        format_price(&total_vat, &invoice.currency),
        10.0,
        Mm(165.0),
        Mm(current_y),
        &regular_font_ref,
    );
    current_y = current_y - 5.0;
    current_layer.use_text(
        "Summa yhteensä:",
        10.0,
        Mm(125.0),
        Mm(current_y),
        &bold_font_ref,
    );
    current_layer.use_text(
        format_price(&total_price, &invoice.currency),
        10.0,
        Mm(165.0),
        Mm(current_y),
        &bold_font_ref,
    );

    //TODO: Render the description and the additional notes on the invoice
    //TODO: Render the billed_by information in the footer of the invoice
    doc.save(&mut BufWriter::new(File::create("test_invoice.pdf").unwrap())).unwrap();
}