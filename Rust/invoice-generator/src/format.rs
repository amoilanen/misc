use bigdecimal::BigDecimal;

pub fn format_vat(value: &f32) -> String {
    format!("{:.1}", value).replace(".", ",")
}

pub fn format_price(value: &BigDecimal) -> String {
    format!("{:.2}", value).replace(".", ",")
}

#[cfg(test)]
mod tests {
    use bigdecimal::FromPrimitive;

    use super::*;

    #[test]
    fn test_format_price() {
        assert_eq!(format_price(&BigDecimal::from_f32(1.212423).unwrap()), "1,21");
        assert_eq!(format_price(&BigDecimal::from_f32(2.3450).unwrap()), "2,35");
        assert_eq!(format_price(&BigDecimal::from_f32(2.30).unwrap()), "2,30");
        assert_eq!(format_price(&BigDecimal::from_f32(2.00).unwrap()), "2,00");
        assert_eq!(format_price(&BigDecimal::from_f32(100.00).unwrap()), "100,00");
    }

    #[test]
    fn test_format_vat() {
        assert_eq!(format_vat(&25.5), "25,5");
        assert_eq!(format_vat(&14.0), "14,0");
    }
}