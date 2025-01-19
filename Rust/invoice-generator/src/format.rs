use bigdecimal::BigDecimal;

pub fn format_vat(value: &f32) -> String {
    format!("{:.1}", value).replace(".", ",")
}

pub fn format_price(value: &BigDecimal, currency: &str) -> String {
    format!("{:.2} {}", value, currency).replace(".", ",")
}

#[cfg(test)]
mod tests {
    use bigdecimal::FromPrimitive;

    use super::*;

    #[test]
    fn test_format_price() {
        assert_eq!(format_price(&BigDecimal::from_f32(1.212423).unwrap(), "EUR"), "1,21 EUR");
        assert_eq!(format_price(&BigDecimal::from_f32(2.3450).unwrap(), "USD"), "2,35 USD");
        assert_eq!(format_price(&BigDecimal::from_f32(2.30).unwrap(), "€"), "2,30 €");
        assert_eq!(format_price(&BigDecimal::from_f32(2.00).unwrap(), "EUR"), "2,00 EUR");
        assert_eq!(format_price(&BigDecimal::from_f32(100.00).unwrap(), "EUR"), "100,00 EUR");
    }

    #[test]
    fn test_format_vat() {
        assert_eq!(format_vat(&25.5), "25,5");
        assert_eq!(format_vat(&14.0), "14,0");
    }
}