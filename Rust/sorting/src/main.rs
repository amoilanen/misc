fn quick_sort<T: Ord + Copy>(values: &[T]) -> Vec<T> {
    let length = values.len();
    if length == 0 {
        return Vec::new();
    } else {
        let pivot: T = values[0];
        let mut values_less_than_pivot: Vec<T> = Vec::new();
        let mut values_greater_than_pivot: Vec<T> = Vec::new();

        for &value in values {
            if value < pivot {
                values_less_than_pivot.push(value);
            } else if value > pivot {
                values_greater_than_pivot.push(value)
            }
        }
        let mut result = quick_sort(&values_less_than_pivot);
        result.append(&mut vec![pivot]);
        result.append(&mut quick_sort(&values_greater_than_pivot));
        return result;
    }
}

fn merge_sort<T: Ord + Copy>(values: &[T]) -> Vec<T> {
    fn merge<T: Ord + Copy>(first: &[T], second: &[T]) -> Vec<T> {
        let mut first_index = 0;
        let first_length = first.len();
        let mut second_index = 0;
        let second_length = second.len();
        let mut result: Vec<T> = Vec::new();
        while first_index < first_length && second_index < second_length {
            if first[first_index] < second[second_index] {
                result.push(first[first_index]);
                first_index = first_index + 1;
            } else {
                result.push(second[second_index]);
                second_index = second_index + 1;
            }
        }
        while first_index < first_length {
            result.push(first[first_index]);
            first_index = first_index + 1;
        }
        while second_index < second_length {
            result.push(second[second_index]);
            second_index = second_index + 1;
        }
        return result;
    }

    let length = values.len();
    if length <= 1 {
        return values.to_vec();
    } else {
        let middle_index = length / 2;
        return merge(
            &merge_sort(&values[0..middle_index]), 
            &merge_sort(&values[middle_index..length]));
    }
}

fn main() {
    let vec = vec![9, 3, 4, 6, 1, 2, 7, 5, 0, 8];
    println!("Quicksort: {:?}", quick_sort(&vec));
    println!("Mergesort: {:?}", merge_sort(&vec))
}
