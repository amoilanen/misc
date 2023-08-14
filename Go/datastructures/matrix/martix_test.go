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