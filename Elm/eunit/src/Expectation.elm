module Expectation exposing (Expectation, eql, isTrue, isFalse)

type alias Expectation = {
  errorMessage: String,
  check: () -> Bool
}

eql: a -> a -> Expectation
eql expected actual =
  let
    errorMessage = "Expected " ++ toString expected ++ " instead encountered " ++ toString actual
  in Expectation errorMessage (\() -> expected == actual)

isTrue: Bool -> Expectation
isTrue actual =
  let
    errorMessage = "Expected to be True, instead False"

  in Expectation errorMessage (\() -> actual)
isFalse: Bool -> Expectation
isFalse actual =
  let
    errorMessage = "Expected to be False, instead True"
  in Expectation errorMessage (\() -> not actual)