fn is_palindrome(s: &str) -> bool {
    let reversed = s.chars().rev().collect::<String>();
    &reversed[0..reversed.len()] == s
}

// Implementation makes an assumption that one string symbol takes one byte
// In general this is not the case in Rust where strings do not support indexing into them
fn ascii_is_palindrome(s: &str) -> bool {
    let len = s.len();
    let mut left = 0;
    let mut right = if len > 1 {
        len - 1
    } else {
        0
    };
    let mut is_palindrome = true;
    while is_palindrome && left < right {
        is_palindrome = s[left..(left + 1)] == s[right..(right + 1)];
        left = left + 1;
        right = right - 1;
    }
    return is_palindrome;
}

fn main() {
    let strings = ["a", "aba", "abababa", "", "abcdef"];

    for s in &strings {
        println!("{} is palindrome = {}", s, ascii_is_palindrome(s))
    }

    for s in &strings {
        println!("{} is palindrome = {}", s, is_palindrome(s))
    }
}
