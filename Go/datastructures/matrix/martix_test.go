package matrix_test

import (
	"testing"
	"github.com/amoilanen/datastructures/matrix"
	"github.com/stretchr/testify/assert"
)

func TestIsEmpty(t *testing.T) {
	s := matrix.NewMatrix[int](2, 3)
	assert.Equal(t, 2, s.Width, "Created matrix has correct width")
	assert.Equal(t, 3, s.Height, "Created matrix has correct height")
}

func TestAddMatrix(t *testing.T) {
	x := matrix.NewMatrixWithElements[int](3, 2, [][]int {
		{1, 2, 3},
		{4, 5, 6},
	})
	y := matrix.NewMatrixWithElements[int](3, 2, [][]int {
		{2, 2, 2},
		{2, 2, 2},
	})
	result, err := x.Add(y)
	assert.Equal(t, nil, err, "Adding two matrixes with the same dimensions should not result in an error")
	assert.Equal(t, [][]int {
		{3, 4, 5},
		{6, 7, 8},
	}, result.Elements, "Elements of the the sum of two matrices are the sums of the elements of the added matrices")
}

func TestAddMatrixDifferentDimensions(t *testing.T) {
	x := matrix.NewMatrixWithElements[int](3, 2, [][]int {
		{1, 2, 3},
		{4, 5, 6},
	})
	y := matrix.NewMatrixWithElements[int](2, 3, [][]int {
		{2, 2},
		{2, 2},
		{2, 2},
	})
	_, err := x.Add(y)
	expectedError := &matrix.MatrixError{ Message: "Incompatible matrix dimensions: this [3, 2], other [2, 3]" }
	assert.Equal(t, expectedError, err, "Adding two matrixes with different dimensions results in an error")
}

func TestNegate(t *testing.T) {
	x := matrix.NewMatrixWithElements[int](3, 4, [][]int {
		{1, 2, 3},
		{4, 5, 6},
		{7, 8, 9},
		{10, 11, 12},
	})
	result := x.Negate()
	assert.Equal(t, [][]int {
		{-1, -2, -3},
		{-4, -5, -6},
		{-7, -8, -9},
		{-10, -11, -12},
	}, result.Elements, "Negating a matrix negates all matrix elements")
}

func TestMultiplyByMatrixMismatchingDimensions(t *testing.T) {
	x := matrix.NewMatrixWithElements[int](3, 1, [][]int {
		{1, 2, 3},
	})
	y := matrix.NewMatrixWithElements[int](3, 1, [][]int {
		{4, 5, 6},
	})
	_, err := x.MultiplyBy(y)
	expectedError := &matrix.MatrixError{ Message: "Incompatible matrix dimensions: this [3, 1], other [3, 1]" }
	assert.Equal(t, expectedError, err, "Multiplying two matrixes with mismatching dimensions results in an error")
}

func TestMultiplyByMatrix(t *testing.T) {
	x := matrix.NewMatrixWithElements[int](3, 2, [][]int {
		{1, 2, 3},
		{4, 5, 6},
	})
	y := matrix.NewMatrixWithElements[int](4, 3, [][]int {
		{1, 1, 0, 0},
		{2, 1, 0, 1},
		{3, 1, 1, 0},
	})
	expected := matrix.NewMatrixWithElements[int](1, 2, [][]int {
		{14, 6, 3, 2},
		{32, 15, 6, 5},
	})
	result, err := x.MultiplyBy(y)
	assert.Equal(t, nil, err, "Multiplying two matrixes with the correct dimensions should not result in an error")
	assert.Equal(t, expected.Elements, result.Elements, "Elements of the product of the two matrices")
}