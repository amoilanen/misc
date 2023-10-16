package main

import (
	"fmt"
	"github.com/amoilanen/datastructures/stack"
	"runtime"
)

func main() {
	s := stack.NewStack[int]()
	s.Push(1)
	s.Push(2)
	s.Push(3)
	fmt.Printf("%v\n", s.Elements())
	fmt.Println("The number of CPU Cores:", runtime.NumCPU())
}