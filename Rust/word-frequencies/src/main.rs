extern crate regex;

use std::collections::HashMap;
use std::fs;
use regex::Regex;
use std::slice::Iter;

fn read_words(file_name: &str) -> Vec<String> {
    let contents = fs::read_to_string(file_name)
        .expect("Something went wrong reading the file");

    let re = Regex::new(r"[a-zA-Z]+").unwrap();
    let mut words: Vec<String> = Vec::new();
    for capture in re.captures_iter(&contents) {
        words.push(capture[0].to_owned());
    }
    words
}

fn compute_frequencies(words: Iter<String>) -> HashMap<String, i32> {
    let mut counts = HashMap::new();
    for word in words {
        let count = counts.entry(word.to_lowercase()).or_insert(0);
        *count += 1;
    }
    counts
}

fn main() {
    let words = read_words("./resources/aeneidos.txt");
    let frequencies = compute_frequencies(words.iter());
    let mut word_count_pairs: Vec<_> = frequencies.iter().collect();

    word_count_pairs.sort_by(|word1_count, word2_count| word2_count.1.cmp(word1_count.1));

    for word_count in word_count_pairs {
        println!("{} - {}", word_count.0, word_count.1)
    }
}
