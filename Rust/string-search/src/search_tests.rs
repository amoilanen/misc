#[cfg(test)]
mod tests {

    use crate::search;
    use crate::search::PatternOccurrence;

    #[test]
    fn find_single_occurence_in_a_string() {
        let occurences = search::find_occurrences("abcdefghjkl", "def");
        assert_eq!(occurences, [PatternOccurrence {
            start: 3,
            end: 6
        }]);
    }

    #[test]
    fn find_multiple_occurences_in_a_string() {
        let occurences = search::find_occurrences("abcdefabcdefabcdef", "cd");
        assert_eq!(occurences, [PatternOccurrence {
            start: 2,
            end: 4
        }, PatternOccurrence {
            start: 8,
            end: 10
        }, PatternOccurrence {
            start: 14,
            end: 16
        }]);
    }

    #[test]
    fn no_occurances_found_in_a_string() {
        let occurences = search::find_occurrences("abcdefabcdefabcdef", "ghk");
        assert_eq!(occurences, []);
    }

    #[test]
    fn no_occurances_found_in_an_empty_string() {
        let occurences = search::find_occurrences("", "ghk");
        assert_eq!(occurences, []);
    }

    #[test]
    fn multiple_occurances_found_with_an_empty_pattern() {
        let occurences = search::find_occurrences("abc", "");
        assert_eq!(occurences, [PatternOccurrence {
            start: 0,
            end: 0
        }, PatternOccurrence {
            start: 1,
            end: 1
        }, PatternOccurrence {
            start: 2,
            end: 2
        }]);
    }

    //TODO: Test a really long string
    //TODO: Test a really long pattern
}