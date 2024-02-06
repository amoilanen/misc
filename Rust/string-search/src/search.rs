use std::cmp;

#[derive(Debug)]
#[derive(PartialEq)]
pub struct PatternOccurrence {
    pub start: usize,
    pub end: usize
}

fn has_match_at_index(index: usize, str: &str, pattern: &str) -> bool {
    let pattern_length: usize = pattern.len();
    if index + pattern_length > str.len() {
        false
    } else {
        &str[index..(index + pattern.len())] == pattern
    }
}

// Primary number used as a base to compute the hash efficiently
const P: u32 = 223;

fn hash(str: &str) -> u32 {
    str.chars().fold(0, |acc, ch| (P * acc) % P + (ch as u32)) % P
}

fn char_u32_at_index(str: &str, idx: usize) -> u32 {
    str.chars().nth(idx).map_or(0, |ch| ch as u32)
}

pub fn find_occurrences_rabin_karp(str: &str, pattern: &str)  -> Vec<PatternOccurrence> {
    //TODO: Re-factor, simplify
    let mut occurrences: Vec<PatternOccurrence> = Vec::new();
    let pattern_length = pattern.len();
    let str_length = str.len();
    let primary_base_coefficient: u32 = P.pow(pattern_length as u32) as u32;

    let pattern_hash: u32 = hash(pattern);
    let last_possible_match_index = if str_length >= pattern_length {
        str_length - pattern_length
    } else {
      0
    };
    let mut possible_match_index: usize = 0;
    let mut current_hash = hash(&str[possible_match_index..cmp::min(possible_match_index + pattern_length, str_length)]);
    while possible_match_index < last_possible_match_index {
        if current_hash == pattern_hash {
            if has_match_at_index(possible_match_index, str, pattern) {
                occurrences.push(PatternOccurrence {
                    start: possible_match_index,
                    end: possible_match_index + pattern_length
                })
            }
        }
        let previous_first_char = char_u32_at_index(str, possible_match_index);
        let new_last_char = char_u32_at_index(str, possible_match_index + pattern_length);
        let correction_term = P - (previous_first_char * primary_base_coefficient % P);
        current_hash = (current_hash * P + correction_term + new_last_char) % P;
        possible_match_index = possible_match_index + 1;
    }

    return occurrences;
}

pub fn find_occurrences_naive(str: &str, pattern: &str) -> Vec<PatternOccurrence> {
    let mut occurrences: Vec<PatternOccurrence> = Vec::new();
    let pattern_length: usize = pattern.len();
    for (index, _) in str.chars().enumerate() {
        if has_match_at_index(index, str, pattern) {
            occurrences.push(PatternOccurrence {
                start: index,
                end: index + pattern_length
            })
        }
    }
    return occurrences;
}

pub fn find_occurrences(str: &str, pattern: &str) -> Vec<PatternOccurrence> {
    return find_occurrences_rabin_karp(str, pattern)
}