package matrix

import "fmt"

type MatrixError struct {
	Message string
}

func (e *MatrixError) Error() string {
	return fmt.Sprintf("Matrix error: %s", e.Message)
}

type Matrix[T any] struct {
	Width int
	Height int
	elements [][]T
}

func NewMatrix[T any](width int, height int) *Matrix[T] {
	elements := make([][]T, height)
	for i:= 0; i < height; i++ {
		elements[i] = make([]T, width)
	}
	return &Matrix[T]{
		Width: width,
		Height: height,
		elements: elements,
	}
}

func (matrix *Matrix[T]) add(other *Matrix[T]) *Matrix[T] {
	//TODO: Implement
	return other
}

func (matrix *Matrix[T]) minus(other *Matrix[T]) *Matrix[T] {
	return matrix.add(other.negate())
}

func (matrix *Matrix[T]) negate() *Matrix[T] {
	//TODO: Implement
	return matrix
}

func (matrix *Matrix[T]) multiply() *Matrix[T] {
	//TODO: Optimize using go routines and a worker pool to construct a new matrix
	//TODO: Implement
	return matrix
}