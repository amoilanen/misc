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

func TestAddMatrixDimensionsMatch(t *testing.T) {
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