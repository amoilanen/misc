
//TODO: Use a generic trait to designate a sortable value?
//TODO: Think about ownership, should we consider doing sorting in place? Is Vec<i32> an appropriate
//return type
fn sort(values: &[i32]) -> Vec<i32> {
    let length = values.len();
    if length == 0 {
        return Vec::new();
    } else {
        let pivot: i32 = values[0];
        let mut values_less_than_pivot: Vec<i32> = Vec::new();
        let mut values_greater_than_pivot: Vec<i32> = Vec::new();

        for &value in values {
            if value < pivot {
                values_less_than_pivot.push(value);
            } else if value > pivot {
                values_greater_than_pivot.push(value)
            }
        }
        let mut result = sort(&values_less_than_pivot);
        result.append(&mut vec![pivot]);
        result.append(&mut sort(&values_greater_than_pivot));
        return result;
    }
}

fn main() {
    let vec = vec![9, 3, 4, 6, 1, 2, 7, 5, 0, 8];
    let sorted = sort(&vec);
    println!("{:?}", sorted);
}
