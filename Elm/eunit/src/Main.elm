import Html exposing (..)
import Html.Attributes exposing (..)

-- TODO: Evaluate tests
-- TODO: Expectations instead of (() -> Bool)
-- TODO: Before spec - setup
-- TODO: After spec - teardown
-- TODO: Report results in other ways? Like a value that will contained passed, failed fields, etc.

-- Constructing the test tree

type Test = Suite String (List Test) | Test String (() -> Bool)

it: String -> (() -> Bool) -> Test
it message assertion =
  Test message assertion

describe: String -> List Test -> Test
describe description suites =
  Suite description suites

-- Runner (generate result HTML from the test tree)
run: Test -> Html msg
run test =
  case test of
    (Suite description tests) ->
      let
        childTests = List.map run tests
      in
        div [class "describe"] ([text(description)] ++ childTests)
    (Test description expectation) ->
      let
        testClass = if expectation() then
          "pass"
        else
          "fail"
      in
        div [class testClass]
          [text(description)]

-- Test example
all : Test
all = describe "first spec"
  [ describe "subspec 1"
    [ it "should add two numbers" <|
        \() -> (1 + 2) == 3
    ]
  ]

main : Html msg
main =
  run all