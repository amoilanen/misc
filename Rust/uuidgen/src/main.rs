use std::vec::Vec;
use std::ops::Add;

fn digit_to_hex(digit: u8) -> char {
    let digit = digit % 16;
    match digit {
        0..=9 => (digit as u32).to_string().pop().unwrap(),
        10 => 'a',
        11 => 'b',
        12 => 'c',
        13 => 'd',
        14 => 'e',
        15 => 'f',
        _ => panic!(format!("Got too large hex digit {}", digit)),
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
