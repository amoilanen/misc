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

fn main() {
    let vec = vec![9, 3, 4, 6, 1, 2, 7, 5, 0, 8];
    let sorted = quick_sort(&vec);
    println!("{:?}", sorted);
}
