package stack_test

import (
	"testing"
	"github.com/amoilanen/datastructures/stack"
	"github.com/stretchr/testify/assert"
)

func TestPushElement(t *testing.T) {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	assert.Equal(t, s.Elements(), []int{3, 2, 1}, "Should contain pushed elements in the reversed order")
}

func TestIsEmpty(t *testing.T) {
	s := stack.NewStack[int]()
	assert.Equal(t, s.IsEmpty(), true, "Stack with no elements is empty")
	s.Push(1)
	assert.Equal(t, s.IsEmpty(), false, "Stack containing elements is not empty")
}
