package matrix

import "fmt"
import "golang.org/x/exp/constraints"

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

func (matrix *Matrix[T]) MultiplyBy(other *Matrix[T]) (*Matrix[T], error) {
	//TODO: Optimize using go routines and a worker pool to construct a new matrix
	if matrix.Width != other.Height {
		return nil, &MatrixError{
			Message: fmt.Sprintf("Incompatible matrix dimensions: this [%d, %d], other [%d, %d]", matrix.Width, matrix.Height, other.Width, other.Height),
		}
	} else {
		resultElements := make([][]T, matrix.Height)
		for row := 0; row < matrix.Height; row++ {
			resultElements[row] = make([]T, other.Width)
			for column := 0; column < other.Width; column++ {
				var result T
				for i := 0; i < matrix.Width; i++ {
					result = result + matrix.Elements[row][i] * other.Elements[i][column]
				}
				resultElements[row][column] = result
			}
		}
		return NewMatrixWithElements(other.Width, matrix.Height, resultElements), nil
	}
}