use anyhow::{Context, Error};
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct Translations {
    pub invoice: InvoiceTranslations,
    pub company_id: String,
    pub vat_id: String,
    pub account: AccountTranslations
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceTranslations {
    pub invoice: String,
    pub number: String,
    pub date: String,
    pub due_date: String,
    pub reference_number: String,
    pub total_price_without_tax: String,
    pub total_price: String,
    pub vat: String,
    pub line: LineTranslations
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountTranslations {
    pub number: String,
    pub bic: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LineTranslations {
    pub item: String,
    pub quantity: String,
    pub price: String,
    pub price_without_tax: String,
    pub vat: String
}

pub fn load_translations(locale: &str) -> Result<Translations, Error> {
    let path = format!("resources/{}.json", locale);
    let raw_translations = fs::read_to_string(path)?;
    let translations: Translations = serde_json::from_str(&raw_translations).context("Could not load translations")?;
    Ok(translations)
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn should_load_translations() {
        let translations = load_translations("fi-FI").unwrap();
        assert_eq!(translations.company_id, "Yritystunnus");
        assert_eq!(translations.invoice.line.price_without_tax, "Veroton hinta");
    }
}