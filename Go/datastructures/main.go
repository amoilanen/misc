package main

import (
	"fmt"
	"github.com/amoilanen/datastructures/stack"
)

func main() {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	fmt.Printf("%v\n", s.Elements())
}