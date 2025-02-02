use invoice_generator::components::Component;
use printpdf::*;
use bigdecimal::{BigDecimal, FromPrimitive};
use std::fs::File;
use std::io::BufWriter;
use invoice_generator::format::{format_price, format_vat};
use invoice_generator::components::table::Table;
use invoice_generator::components::label::Label;

struct BillingAddress {
    name: String,
    email: Option<String>,
    company_id: Option<String>,
    vat_id: Option<String>,
    phone_number: Option<String>,
    address_line_1: String,
    address_line_2: Option<String>,
    address_line_3: Option<String>,
    detail: Option<String>
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
    invoice_description: String,
    currency: String,
    vat_percent: f32,
    billed_at: String,
    due_date: String,
    invoice_number: String,
    reference_id: Option<String>,
    note: Option<String>,
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
            detail: None
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
            detail: None
        },
        bank_details: BankDetails {
            account_number: "FI22 1234 5678 1234 56".to_owned(),
            bic_code: "NDEAFIHH".to_owned()
        },
        currency: "EUR".to_owned(),
        vat_percent: 25.5,
        billed_at: "17.01.2025".to_owned(),
        due_date: "31.01.2025".to_owned(),
        invoice_description: "Tietokone avustus: desktop järjestelmän asennus ja konfigurointi".to_owned(),
        invoice_number: "2025-0001".to_owned(),
        reference_id: Some("4387349".to_owned()),
        note: Some("Tietokonen huolto ja päivitys".to_owned()),
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
        Mm(120.0),
        Mm(270.0),
        &regular_font_ref,
    );

    let invoice_info = Table {
        column_widths: vec![30.0, 30.0],
        row_height: 5.0,
        header: None,
        rows: Label::new_rows(
            vec![
                vec!["Laskunumero", &invoice.invoice_number],
                vec!["Päiväys", &invoice.billed_at],
                vec!["Eräpäivä", &invoice.due_date],
                vec!["Viitenumero", &invoice.reference_id.unwrap_or("".to_owned())],
                vec!["Tilinumero", &invoice.bank_details.account_number],
                vec!["BIC-koodi:", &invoice.bank_details.bic_code]
            ],
            11.0,
            &regular_font_ref
        )
    };
    invoice_info.render_at(120.0, 260.0, &current_layer);

    let mut billed_to_lines = vec![
        vec![invoice.billed_to.name.as_str()],
        vec![invoice.billed_to.address_line_1.as_str()]
    ];
    if let Some(address_line_2) = invoice.billed_to.address_line_2.as_ref() {
        billed_to_lines.push(vec![address_line_2.as_str()]);
    }
    if let Some(address_line_3) = invoice.billed_to.address_line_3.as_ref() {
        billed_to_lines.push(vec![address_line_3.as_str()]);
    }
    let billed_to = Table {
        column_widths: vec![30.0],
        row_height: 5.0,
        header: None,
        rows: Label::new_rows(billed_to_lines,
            11.0,
            &regular_font_ref
        )
    };
    billed_to.render_at(15.0, 260.0, &current_layer);

    let mut invoice_lines: Vec<Vec<String>> = Vec::new();
    for invoice_line in invoice.invoice_lines.iter() {
        let price_without_vat = &invoice_line.price / BigDecimal::from_f32(1.0 + invoice.vat_percent / 100.0).unwrap();
        invoice_lines.push(vec![
            format!("{}", invoice_line.name),
            format!("{}", invoice_line.count),
            format_price(&invoice_line.price, &invoice.currency),
            format_price(&price_without_vat, &invoice.currency),
            format_vat(&invoice.vat_percent)
        ]);
    }
    let invoice_info = Table {
        column_widths: vec![60.0, 30.0, 30.0, 50.0, 15.0],
        row_height: 5.0,
        header: Some(Label::new_row(vec![
            "Tuote", "Määrä", "Hinta (sis. ALV)", "Veroton hinta", "ALV %"
        ], 10.0, &bold_font_ref)),
        rows: Label::new_rows(
            invoice_lines.iter().map(|x| x.iter().map(|s| s.as_str()).collect()).collect(),
            10.0,
            &regular_font_ref
        )
    };
    invoice_info.render_at(15.0, 200.0, &current_layer);

    let mut current_y = 185.0;
    let total_price: BigDecimal = invoice.invoice_lines.iter().map(|line| &line.price).sum();
    let total_vat: BigDecimal = BigDecimal::from_f32(invoice.vat_percent / 100.0).unwrap() * &total_price;
    let total_price_without_vat = &total_price / BigDecimal::from_f32(1.0 + invoice.vat_percent / 100.0).unwrap();
    current_y = current_y - 21.0;

    let summary = Table {
        column_widths: vec![40.0, 30.0],
        row_height: 5.0,
        header: None,
        rows: vec![
            Label::new_row(
                vec!["Veroton hinta yhteensä:", &format_price(&total_price_without_vat, &invoice.currency)],
                10.0,
                &regular_font_ref
            ),
            Label::new_row(
                vec![&format!("Alv {} %:", invoice.vat_percent), &format_price(&total_vat, &invoice.currency)],
                10.0,
                &regular_font_ref
            ),
            Label::new_row(
                vec!["Summa yhteensä:", &format_price(&total_price, &invoice.currency)],
                10.0,
                &bold_font_ref
            )
        ]
    };
    summary.render_at(125.0, current_y, &current_layer);

    current_layer.use_text(
        invoice.note.unwrap_or("".to_owned()),
        10.0,
        Mm(15.0),
        Mm(140.0),
        &regular_font_ref,
    );

    // Footer upper border
    current_layer.set_outline_thickness(0.8);
    current_layer.add_line(
        Line {
            points: vec![
                (Point::new(Mm(15.0), Mm(25.0)), false),
                (Point::new(Mm(200.0), Mm(25.0)), false),
            ],
            is_closed: false
        }
    );
    let billed_by = Table {
        column_widths: vec![60.0, 60.0, 65.0],
        row_height: 3.0,
        header: None,
        rows: Label::new_rows(
            vec![
                vec![&invoice.billed_by.name, &invoice.billed_by.company_id.map(|s| format!("Yritystunnus: {}", s)).unwrap_or("".to_owned()), &invoice.billed_by.email.unwrap_or("".to_owned())],
                vec![&invoice.billed_by.address_line_1, &invoice.billed_by.vat_id.map(|s| format!("ALV tunnus: {}", s)).unwrap_or("".to_owned()), &invoice.billed_by.phone_number.unwrap_or("".to_owned())],
                vec![&invoice.billed_by.address_line_2.unwrap_or("".to_owned()), &invoice.bank_details.account_number, ""],
                vec![&invoice.billed_by.address_line_3.unwrap_or("".to_owned()), &invoice.bank_details.bic_code, ""],
                vec![&invoice.billed_by.detail.unwrap_or("".to_owned()), "", ""]
            ],
            7.0,
            &regular_font_ref
        )
    };
    billed_by.render_at(25.0, 20.0, &current_layer);

    doc.save(&mut BufWriter::new(File::create(format!("{}.pdf", invoice.invoice_number)).unwrap())).unwrap();
}