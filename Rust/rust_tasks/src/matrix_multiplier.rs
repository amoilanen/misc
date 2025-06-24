use std::thread::Thread;
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(PartialEq, Debug, Clone)]
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

fn validate_dimensions(x: &Matrix, y: &Matrix) -> Result<(), MatrixError> {
    if x.column_count() != y.row_count() {
        return Err(MatrixError::InvalidDimensions(
            format!("Cannot multiply matrix of dimensions {}x{} with matrix of dimensions {}x{}", 
                x.row_count(), x.column_count(), y.row_count(), y.column_count())
        ));
    }
    Ok(())
}

fn calculate_cell(row: &[f64], y: &Matrix, col_idx: usize) -> f64 {
    row.iter()
        .enumerate()
        .map(|(i, &val)| val * y.rows[i][col_idx])
        .sum()
}

fn process_row_range(start_row: usize, x: &[Vec<f64>], y: &Matrix, result: Arc<Mutex<Matrix>>) {
    for (local_row_idx, row) in x.iter().enumerate() {
        let global_row_idx = start_row + local_row_idx;
        for j in 0..y.column_count() {
            let value = calculate_cell(row, &y, j);
            let mut result = result.lock().unwrap();
            result.rows[global_row_idx][j] = value;
        }
    }
}

pub fn multiply(x: Matrix, y: Matrix, num_threads: usize) -> Result<Matrix, MatrixError> {
    validate_dimensions(&x, &y)?;

    if x.row_count() == 0 || y.column_count() == 0 {
        return Ok(Matrix::new(0, 0));
    }

    let mut result = Matrix::new(x.row_count(), y.column_count());
    let result = Arc::new(Mutex::new(result));
    let y = Arc::new(y);
    let mut handles = vec![];

    let rows_per_thread = (x.row_count() + num_threads - 1) / num_threads;
    
    for thread_idx in 0..num_threads {
        let start_row = thread_idx * rows_per_thread;
        let end_row = (start_row + rows_per_thread).min(x.row_count());
        
        if start_row >= x.row_count() {
            break;
        }

        let result = Arc::clone(&result);
        let x = x.rows[start_row..end_row].to_vec();
        let y = Arc::clone(&y);
        
        let handle = thread::spawn(move || {
            process_row_range(start_row, &x, &y, result);
        });
        
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let result = Arc::try_unwrap(result)
        .unwrap()
        .into_inner()
        .unwrap();

    Ok(result)
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