package matrix

import (
	"fmt"
	"golang.org/x/exp/constraints"
	"runtime"
)

type Number interface {
	constraints.Integer | constraints.Float
}

type MatrixError struct {
	Message string
}

func (e *MatrixError) Error() string {
	return fmt.Sprintf("Matrix error: %s", e.Message)
}

type Matrix[T Number] struct {
	Width int
	Height int
	Elements [][]T
}

func NewMatrix[T Number](width int, height int) *Matrix[T] {
	elements := make([][]T, height)
	for i:= 0; i < height; i++ {
		elements[i] = make([]T, width)
	}
	return &Matrix[T]{
		Width: width,
		Height: height,
		Elements: elements,
	}
}

func NewMatrixWithElements[T Number](width int, height int, elements [][]T) *Matrix[T] {
	matrix := NewMatrix[T](width, height)
	matrix.Elements = elements
	return matrix
}

func (matrix *Matrix[T]) Add(other *Matrix[T]) (*Matrix[T], error) {
	if matrix.Width != other.Width || matrix.Height != other.Height {
		return nil, &MatrixError{
			Message: fmt.Sprintf("Incompatible matrix dimensions: this [%d, %d], other [%d, %d]", matrix.Width, matrix.Height, other.Width, other.Height),
		}
	} else {
		resultElements := make([][]T, matrix.Height)
		for row := 0; row < matrix.Height; row++ {
			resultElements[row] = make([]T, matrix.Width)
			for column := 0; column < matrix.Width; column++ {
				resultElements[row][column] = matrix.Elements[row][column] + other.Elements[row][column]
			}
		}
		return NewMatrixWithElements(matrix.Width, matrix.Height, resultElements), nil
	}
}

func (matrix *Matrix[T]) Minus(other *Matrix[T]) (*Matrix[T], error) {
	return matrix.Add(other.Negate())
}

func (matrix *Matrix[T]) Negate() *Matrix[T] {
	resultElements := make([][]T, matrix.Height)
	for row := 0; row < matrix.Height; row++ {
		resultElements[row] = make([]T, matrix.Width)
		for column := 0; column < matrix.Width; column++ {
			resultElements[row][column] = -matrix.Elements[row][column]
		}
	}
	return NewMatrixWithElements(matrix.Width, matrix.Height, resultElements)
}

type MultiplicationJob[T Number] struct {
	first *Matrix[T]
	second *Matrix[T]
	row int
	column int
}

type MultiplicationJobResult[T Number] struct {
	row int
	column int
	result T
}

func mutliplicationWorker[T Number](jobs <-chan MultiplicationJob[T], jobResults chan<- MultiplicationJobResult[T]) {
	for job := range jobs {
		row := job.row
		column := job.column
		firstElements := job.first.Elements
		secondElements := job.second.Elements
		var result T
		for i := 0; i < job.first.Width; i++ {
			result = result + firstElements[row][i] * secondElements[i][column]
		}
		jobResults <- MultiplicationJobResult[T]{
			row: row,
			column: column,
			result: result,
		}
	}
}

func (matrix *Matrix[T]) MultiplyBy(other *Matrix[T]) (*Matrix[T], error) {
	if matrix.Width != other.Height {
		return nil, &MatrixError{
			Message: fmt.Sprintf("Incompatible matrix dimensions: this [%d, %d], other [%d, %d]", matrix.Width, matrix.Height, other.Width, other.Height),
		}
	} else {
		defaultBatchSize := 50
		workerNumber := runtime.NumCPU()
		numJobs := matrix.Height * other.Width
		jobs := make(chan MultiplicationJob[T], defaultBatchSize)
		jobResults := make(chan MultiplicationJobResult[T], defaultBatchSize)
		for w := 1; w <= workerNumber; w++ {
			go mutliplicationWorker(jobs, jobResults)
		}

		/*
		 * Initialize the results and submit the computation jobs
		 */
		resultElements := make([][]T, matrix.Height)
		for row := 0; row < matrix.Height; row++ {
			resultElements[row] = make([]T, other.Width)
			for column := 0; column < other.Width; column++ {
				jobs <- MultiplicationJob[T]{
					first: matrix,
					second: other,
					row: row,
					column: column,
				}
			}
		}
		close(jobs)

		/*
		 * Gather the computation job results
		 */
		for i := 0; i < numJobs; i++ {
			jobResult := <- jobResults
			resultElements[jobResult.row][jobResult.column] = jobResult.result
		}
		close(jobResults)
		return NewMatrixWithElements(other.Width, matrix.Height, resultElements), nil
	}
}