use anyhow::Error;
use bigdecimal::{BigDecimal, FromPrimitive};
use std::fs::File;
use std::io::BufWriter;
use invoice_generator::renderer::render;
use invoice_generator::invoice::{BankDetails, BillingAddress, Invoice, InvoiceLine};

fn main() -> Result<(), Error> {
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
        }],
        locale: "fi-FI".to_owned()
    };

    let doc = render(&invoice)?;
    doc.save(&mut BufWriter::new(File::create(format!("{}.pdf", invoice.invoice_number)).unwrap())).unwrap();
    Ok(())
}