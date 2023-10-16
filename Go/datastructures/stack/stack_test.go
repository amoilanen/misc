package stack_test

import (
	"testing"
	"github.com/amoilanen/datastructures/stack"
	"github.com/stretchr/testify/assert"
)

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

func TestPopWithNonEmptyStack(t *testing.T) {
	s := stack.NewStack[string]()
	s.Push("a")
	s.Push("b")
	s.Push("c")
	result, err := s.Pop()
	assert.Equal(t, nil, err, "Peek on non-empty Stack should not return error")
	assert.Equal(t, "c", result, "Peek should return the element which was pushed to the stack last")
	assert.Equal(t, []string{"b", "a"}, s.Elements(), "Should contain the elements besides the poped one in the reversed order")
}

func TestPopWithEmptyStack(t *testing.T) {
	s := stack.NewStack[string]()
	expectedError := stack.StackError{"Cannot Pop() on an empty Stack"}
	_, err := s.Pop()
	assert.Equal(t, &expectedError, err, "Pop on empty Stack should return an error")
}

func TestPush(t *testing.T) {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	result, _ := s.Pop()
	assert.Equal(t, 3, result, "Last pushed element is at the top")
	result, _ = s.Pop()
	assert.Equal(t, 2, result, "The intermediate element")
	result, _ = s.Pop()
	assert.Equal(t, 1, result, "First pushed element is at the bottom")
	assert.Equal(t, true, s.IsEmpty(), "No other elements are contained")
}

func TestElementsWithNonEmptyStack(t *testing.T) {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	assert.Equal(t, []int{3, 2, 1}, s.Elements(), "Elements() should return all the pushed elements")
}

func TestElementsWithEmptyStack(t *testing.T) {
	s := stack.NewStack[int]()
	assert.Equal(t, []int{}, s.Elements(), "Elements() should return an empty slice for an empty stack")
}

func TestClear(t *testing.T) {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	s.Clear()
	assert.Equal(t, []int{}, s.Elements(), "Stack should contain no elements after clearing")
}

func TestStackOfPointers(t *testing.T) {
	type city struct {
		name string
		populationSize int
	}

	tokyo := city{name: "Tokyo", populationSize: 37468000 }
	delhi := city{name: "Delhi", populationSize: 28514000 }
	shanghai := city{name: "Shanghai", populationSize: 25582000}
	s := stack.NewStack[*city]()
	s.Push(&tokyo)
	s.Push(&delhi)
	s.Push(&shanghai)
	topCity, err := s.Pop()

	assert.Equal(t, nil, err, "Pop on non-empty Stack should not return error")
	assert.Equal(t, shanghai, *topCity, "Top element can be dereferenced")
}