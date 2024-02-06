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

const PRIMARY_BASE: u16 = 223;

fn hash(str: &str) -> u16 {
    str.chars().fold(0, |acc, ch| PRIMARY_BASE * acc + (ch as u16))
}

pub fn find_occurrences_rabin_karp(str: &str, pattern: &str)  -> Vec<PatternOccurrence> {
    //TODO: Debug, re-factor, simplify
    let mut occurrences: Vec<PatternOccurrence> = Vec::new();
    let pattern_length = pattern.len();
    let str_length = str.len();
    let primary_base_coefficient: u16 = PRIMARY_BASE.pow(pattern_length as u32);

    let pattern_hash: u16 = hash(pattern);
    let mut possible_match_index = 0;
    let mut current_hash: Option<u16> = None;
    while possible_match_index < str_length - pattern_length {
        current_hash = match current_hash {
            Some(hash_value) => 
                Some((hash_value * PRIMARY_BASE - (str.chars().nth(possible_match_index - 1).unwrap() as u16) * primary_base_coefficient + (str.chars().nth(possible_match_index + pattern_length - 1).unwrap() as u16)) % PRIMARY_BASE),
            None => Some(hash(&str[possible_match_index..(possible_match_index + pattern_length)]))
        };
        match current_hash {
            Some(hash_value) =>
                if hash_value == pattern_hash {
                    if has_match_at_index(possible_match_index, str, pattern) {
                        occurrences.push(PatternOccurrence {
                            start: possible_match_index,
                            end: possible_match_index + pattern_length
                        })
                    }
                }
            None => ()
        };
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