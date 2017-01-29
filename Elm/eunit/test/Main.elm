import Expectation exposing (..)
import Test exposing (..)
import Runner exposing (..)

import Html exposing (..)

all : Test
all = describe "Arithmetic operations"
  [ describe "Addition"
    [ it "should add two positive numbers" <|
        eql (1 + 2) 3
      , it "should be commutative" <|
        eql (1 + 2) (2 + 1)
      , it "should be associative" <|
        eql ((1 + 2) + 3) (1 + (2 + 3))
    ]
    , describe "Multiplication"
    [
      it "should multiply two positive numbers" <|
        eql (2 * 3) 6
      , it "should be commutative" <|
        eql (2 * 3) (3 * 2)
      , it "should be associative" <|
        eql ((2 * 3) * 4) (2 * (3 * 4))
    ]
    , describe "Subtraction"
    [
      it "should subtract two  numbers" <|
        eql (2 - 3) -1
      , it "should be commutative?" <| -- Failing test, subtraction is not commutative!
        eql (2 - 3) (3 - 2)
      , it "should be associative?" <| -- Failing test, subtraction is not associative!
        isTrue (((2 - 3) - 4) == (2 - (3 - 4)))
    ]
  ]

main : Html msg
main =
  runAll all