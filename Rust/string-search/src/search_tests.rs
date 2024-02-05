#[cfg(test)]
mod tests {

    use crate::search;
    use crate::search::PatternOccurance;

    #[test]
    fn find_single_occurence_in_a_string() {
        let occurences = search::find_occurances("abcdefghjkl", "def");
        assert_eq!(occurences, [PatternOccurance {
            start: 3,
            end: 6
        }]);
    }

    #[test]
    fn find_multiple_occurences_in_a_string() {
        let occurences = search::find_occurances("abcdefabcdefabcdef", "cd");
        assert_eq!(occurences, [PatternOccurance {
            start: 2,
            end: 4
        }, PatternOccurance {
            start: 8,
            end: 10
        }, PatternOccurance {
            start: 14,
            end: 16
        }]);
    }

    #[test]
    fn no_occurances_found_in_a_string() {
        let occurences = search::find_occurances("abcdefabcdefabcdef", "ghk");
        assert_eq!(occurences, []);
    }

    #[test]
    fn no_occurances_found_in_an_empty_string() {
        let occurences = search::find_occurances("", "ghk");
        assert_eq!(occurences, []);
    }

    #[test]
    fn multiple_occurances_found_with_an_empty_pattern() {
        let occurences = search::find_occurances("abc", "");
        assert_eq!(occurences, [PatternOccurance {
            start: 0,
            end: 1
        }, PatternOccurance {
            start: 1,
            end: 2
        }, PatternOccurance {
            start: 2,
            end: 3
        }]);
    }
}