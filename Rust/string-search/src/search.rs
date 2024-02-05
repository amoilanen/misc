
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

pub fn find_occurrences(str: &str, pattern: &str) -> Vec<PatternOccurrence> {
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