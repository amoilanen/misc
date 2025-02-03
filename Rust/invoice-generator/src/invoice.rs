use anyhow::{Context, Error};
use serde::{Deserialize, Serialize};
use serde_json;
use bigdecimal::BigDecimal;

#[derive(Debug, Serialize, Deserialize)]
pub struct BillingAddress {
    pub name: String,
    pub email: Option<String>,
    pub company_id: Option<String>,
    pub vat_id: Option<String>,
    pub phone_number: Option<String>,
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub address_line_3: Option<String>,
    pub detail: Option<String>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceLine {
    pub name: String,
    pub count: usize,
    pub price: BigDecimal
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BankDetails {
    pub account_number: String,
    pub bic_code: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Invoice {
    pub billed_to: BillingAddress,
    pub billed_by: BillingAddress,
    pub invoice_description: Option<String>,
    pub currency: String,
    pub vat_percent: f32,
    pub billed_at: String,
    pub due_date: String,
    pub invoice_number: String,
    pub reference_id: Option<String>,
    pub note: Option<String>,
    pub bank_details: BankDetails,
    pub invoice_lines: Vec<InvoiceLine>,
    pub locale: String
}

pub fn parse_invoice_json(raw_invoice: &str) -> Result<Invoice, Error> {
    let translations: Invoice = serde_json::from_str(raw_invoice).context("Could not load translations")?;
    Ok(translations)
}