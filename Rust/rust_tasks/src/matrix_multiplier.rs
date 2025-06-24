use std::thread::Thread;
use std::sync::{Arc, Mutex};

#[derive(PartialEq, Debug)]
pub struct Matrix {
    pub rows: Vec<Vec<f64>>
}

impl Matrix {
    pub fn new(row_count: usize, column_count: usize) -> Matrix {
        let rows = vec![vec![0f64; column_count]; row_count];
        Matrix {
            rows
        }
    }
    pub fn row_count(&self) -> usize {
        self.rows.len()
    }
    pub fn column_count(&self) -> usize {
        if let Some(first_row) = self.rows.get(0) {
            first_row.len()
        } else {
            0
        }
    }
}

#[derive(PartialEq, Debug)]
pub enum MatrixError {
    InvalidDimensions(String)
}

pub fn multiply(x: Matrix, y: Matrix, num_threads: usize) -> Result<Matrix, MatrixError> {
    if x.column_count() != y.row_count() {
        return Err(MatrixError::InvalidDimensions(
            format!("Cannot multiply matrix of dimensions {}x{} with matrix of dimensions {}x{}",
                x.row_count(), x.column_count(), y.row_count(), y.column_count())
        ));
    }

    let result = Arc::new(Mutex::new(Matrix::new(x.row_count(), y.column_count())));
    let mut tasks: Vec<Vec<(usize, usize)>> = vec![Vec::new(); num_threads];

    for i in 0..x.row_count() {
        for j in 0..y.column_count() {
            let task_hash = (i * 31 + j) % num_threads;
            tasks[task_hash].push((i, j));
        }
    }

    let x = Arc::new(x);
    let y = Arc::new(y);
    let mut threads = Vec::new();

    for thread_tasks in tasks {
        let x = Arc::clone(&x);
        let y = Arc::clone(&y);
        let result = Arc::clone(&result);

        let thread = std::thread::spawn(move || {
            for (i, j) in thread_tasks {
                let mut sum = 0.0;
                for k in 0..x.column_count() {
                    sum += x.rows[i][k] * y.rows[k][j];
                }
                let mut result = result.lock().unwrap();
                result.rows[i][j] = sum;
            }
        });
        threads.push(thread);
    }

    for thread in threads {
        thread.join().unwrap();
    }

    let mutex = Arc::try_unwrap(result).unwrap();
    Ok(mutex.into_inner().unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_matrix_multiplication_2x2() {
        let mut matrix1 = Matrix::new(2, 2);
        matrix1.rows = vec![
            vec![1.0, 2.0],
            vec![3.0, 4.0]
        ];

        let mut matrix2 = Matrix::new(2, 2);
        matrix2.rows = vec![
            vec![5.0, 6.0],
            vec![7.0, 8.0]
        ];

        let result = multiply(matrix1, matrix2, 2).unwrap();
        assert_eq!(result.rows, vec![
            vec![19.0, 22.0],
            vec![43.0, 50.0]
        ]);
    }

    #[test]
    fn test_valid_matrix_multiplication_2x3_3x2() {
        let mut matrix1 = Matrix::new(2, 3);
        matrix1.rows = vec![
            vec![1.0, 2.0, 3.0],
            vec![4.0, 5.0, 6.0]
        ];

        let mut matrix2 = Matrix::new(3, 2);
        matrix2.rows = vec![
            vec![7.0, 8.0],
            vec![9.0, 10.0],
            vec![11.0, 12.0]
        ];

        let result = multiply(matrix1, matrix2, 2).unwrap();
        assert_eq!(result.rows, vec![
            vec![58.0, 64.0],
            vec![139.0, 154.0]
        ]);
    }

    #[test]
    fn test_invalid_dimensions() {
        let matrix1 = Matrix::new(2, 3);
        let matrix2 = Matrix::new(2, 2);

        let result = multiply(matrix1, matrix2, 2);
        assert!(matches!(result, Err(MatrixError::InvalidDimensions(_))));
    }

    #[test]
    fn test_multiplication_with_empty_matrix() {
        let matrix1 = Matrix::new(0, 0);
        let matrix2 = Matrix::new(0, 0);

        let result = multiply(matrix1, matrix2, 2).unwrap();
        assert_eq!(result.row_count(), 0);
        assert_eq!(result.column_count(), 0);
    }
}