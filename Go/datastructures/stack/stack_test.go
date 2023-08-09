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
	assert.Equal(t, []int{3, 2, 1}, s.Elements(), "Should contain pushed elements in the reversed order")
}

func TestIsEmpty(t *testing.T) {
	s := stack.NewStack[int]()
	assert.Equal(t, true, s.IsEmpty(), "Stack with no elements is empty")
	s.Push(1)
	assert.Equal(t, false, s.IsEmpty(), "Stack containing elements is not empty")
}

func TestPeekWithNonEmptyStack(t *testing.T) {
	s := stack.NewStack[string]()
	s.Push("a")
	s.Push("b")
	s.Push("c")
	result, err := s.Peek()
	assert.Equal(t, nil, err, "Peek on non-empty Stack should not return error")
	assert.Equal(t, "c", result, "Peek should return the element which was pushed to the stack last")
}

func TestPeekWithEmptyStack(t *testing.T) {
	s := stack.NewStack[string]()
	expectedError := stack.StackError{"Cannot Peek() on an empty Stack"}
	_, err := s.Peek()
	assert.Equal(t, &expectedError, err, "Peek on empty Stack should return an error")
}

//TODO: Put pointers to a struct to the stack and retrieve them