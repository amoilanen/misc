package stack

import "fmt"

type StackError struct {
	Message string
}

func (e *StackError) Error() string {
	return fmt.Sprintf("Stack error: %s", e.Message)
}


type Stack[T any] struct {
	top *stackElement[T]
}

type stackElement[T any] struct {
	next *stackElement[T]
	element T
}

func NewStack[T any]() *Stack[T] {
	return &Stack[T] {
		top: nil,
	}
}

func (stack *Stack[T]) IsEmpty() bool {
	return stack.top == nil
}

func (stack * Stack[T]) Peek() (T, error) {
	if stack.IsEmpty() {
		var emptyResult T
		return emptyResult, &StackError{
			Message: "Cannot Peek() on an empty Stack",
		}
	} else {
		return stack.top.element, nil
	}
}

func (stack *Stack[T]) Pop() (T, error) {
	if stack.IsEmpty() {
		var emptyResult T
		return emptyResult, &StackError{
			Message: "Cannot Pop() on an empty Stack",
		}
	} else {
		topElement := stack.top.element
		stack.top = stack.top.next
		return topElement, nil
	}
}

func (stack *Stack[T]) Push(newElement T) *Stack[T] {
	currentTop := stack.top
	newTop := stackElement[T] {
		next: currentTop,
		element: newElement,
	}
	stack.top = &newTop
	return stack
}

func (stack *Stack[T]) Elements() []T {
	collectedElements := []T{}
	top := stack.top
	for top != nil {
		collectedElements = append(collectedElements, top.element)
		top = top.next
	}
	return collectedElements
}

func (stack *Stack[T]) Clear() *Stack[T] {
	stack.top = nil
	return stack
}