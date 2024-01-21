use std::vec::Vec;
use std::char;

fn digit_to_hex(digit: u8) -> char {
    let digit = digit;
    match digit {
        0..=9 => char::from_u32((digit + ('0' as u8)) as u32).unwrap(),
        10 => 'a',
        11 => 'b',
        12 => 'c',
        13 => 'd',
        14 => 'e',
        15 => 'f',
        _ => panic!("Got a hex digit out of bounds {}", digit),
    }
}

fn random_hex_string_of_length(length: u8) -> String {
    let chars: Vec<char> = (0..length).map(|_idx| {
        let rand_number: u8 = rand::random::<u8>() % 16;
        digit_to_hex(rand_number)
    }).collect();
    chars.into_iter().collect()
}

fn generate_uuid() -> String {
    let hex_string = random_hex_string_of_length;
    format!("{}-{}-{}-{}-{}",
            hex_string(8),
            hex_string(4),
            hex_string(4),
            hex_string(4),
            hex_string(12)
    )
}

fn main() {
    println!("{}", generate_uuid());
}
