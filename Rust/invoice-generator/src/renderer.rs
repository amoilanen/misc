
use anyhow::Error;
use printpdf::*;
use crate::components::Component;
use crate::invoice::Invoice;
use bigdecimal::{BigDecimal, FromPrimitive};
use crate::format::{format_price, format_vat};
use crate::components::table::Table;
use crate::components::label::Label;
use crate::locale::load_translations;

pub fn render(invoice: &Invoice) -> Result<PdfDocumentReference, Error> {
    let translations = load_translations(&invoice.locale)?;
    let (doc, page1, layer1) = PdfDocument::new(format!("{} {}", translations.invoice.invoice, invoice.invoice_number), Mm(210.0), Mm(297.0), "Layer 1");

    let regular_font = BuiltinFont::Helvetica;
    let regular_font_ref = doc.add_builtin_font(regular_font).unwrap();
    let bold_font = BuiltinFont::HelveticaBold;
    let bold_font_ref = doc.add_builtin_font(bold_font).unwrap();

    let current_layer = doc.get_page(page1).get_layer(layer1);

    current_layer.use_text(
        &translations.invoice.invoice,
        24.0,
        Mm(110.0),
        Mm(270.0),
        &regular_font_ref,
    );

    let invoice_info = Table {
        column_widths: vec![40.0, 30.0],
        row_height: 5.0,
        header: None,
        rows: Label::new_rows(
            vec![
                vec![&format!("{}:", &translations.invoice.number), &invoice.invoice_number],
                vec![&format!("{}:", &translations.invoice.date), &invoice.billed_at],
                vec![&format!("{}:", &translations.invoice.due_date), &invoice.due_date],
                vec![&format!("{}:", &translations.invoice.reference_number), &invoice.reference_id.as_ref().unwrap_or(&"".to_owned())],
                vec![&format!("{}:", &translations.account.number), &invoice.bank_details.account_number],
                vec![&format!("{}:", &translations.account.bic), &invoice.bank_details.bic_code]
            ],
            11.0,
            &regular_font_ref
        )
    };
    invoice_info.render_at(110.0, 260.0, &current_layer);

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
            &translations.invoice.line.item, &translations.invoice.line.quantity, &translations.invoice.line.price,
            &translations.invoice.line.price_without_tax, &format!("{} %", &translations.invoice.line.vat)
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
                vec![&format!("{}:", &translations.invoice.total_price_without_tax), &format_price(&total_price_without_vat, &invoice.currency)],
                10.0,
                &regular_font_ref
            ),
            Label::new_row(
                vec![&format!("{} {} %:", &translations.invoice.vat, invoice.vat_percent), &format_price(&total_vat, &invoice.currency)],
                10.0,
                &regular_font_ref
            ),
            Label::new_row(
                vec![&format!("{}:", &translations.invoice.total_price), &format_price(&total_price, &invoice.currency)],
                10.0,
                &bold_font_ref
            )
        ]
    };
    summary.render_at(125.0, current_y, &current_layer);

    current_layer.use_text(
        invoice.note.as_ref().unwrap_or(&"".to_owned()),
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
                vec![&invoice.billed_by.name, &invoice.billed_by.company_id.as_ref().map(|s| format!("{}: {}", &translations.company_id, s)).unwrap_or("".to_owned()), &invoice.billed_by.email.as_ref().unwrap_or(&"".to_owned())],
                vec![&invoice.billed_by.address_line_1, &invoice.billed_by.vat_id.as_ref().map(|s| format!("{}: {}", &translations.vat_id, s)).unwrap_or("".to_owned()), &invoice.billed_by.phone_number.as_ref().unwrap_or(&"".to_owned())],
                vec![&invoice.billed_by.address_line_2.as_ref().unwrap_or(&"".to_owned()), &invoice.bank_details.account_number, ""],
                vec![&invoice.billed_by.address_line_3.as_ref().unwrap_or(&"".to_owned()), &invoice.bank_details.bic_code, ""],
                vec![&invoice.billed_by.detail.as_ref().unwrap_or(&"".to_owned()), "", ""]
            ],
            7.0,
            &regular_font_ref
        )
    };
    billed_by.render_at(25.0, 20.0, &current_layer);
    Ok(doc)
}