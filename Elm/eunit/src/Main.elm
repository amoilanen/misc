import Html exposing (..)
import Html.Attributes exposing (..)

-- TODO: Evaluate tests
-- TODO: Report overall results? (number of failed, passed tests)
-- TODO: Before spec - setup
-- TODO: After spec - teardown
-- TODO: Expectations instead of (() -> Bool)

-- TODO: Report results in other ways? Like a value that will contained passed, failed fields, etc.

-- Constructing the test tree

type Test = Suite String (List Test) | Test String (() -> Bool)

it: String -> (() -> Bool) -> Test
it message assertion =
  Test message assertion

describe: String -> List Test -> Test
describe description suites =
  Suite description suites

-- Styles
commonCssStyles: Html msg
commonCssStyles = 
  let
    styleContent = """
      .describe, .pass, .fail {
        margin-left: 1rem;
      }
      .pass {
        color: green;
      }
      .fail {
        color: red;
      }
    """
  in node "style" [] [text(styleContent)]


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

runAll: Test -> Html msg
runAll test =
  div []
    [
      commonCssStyles
      , h3 [] [text("Test results")]
      , run test
    ]

-- Test example
all : Test
all = describe "Arithmetic operations"
  [ describe "Plus"
    [ it "should add two positive numbers" <|
        \() -> (1 + 2) == 3
      , it "should be commutative" <|
        \() -> (1 + 2) == (2 + 1)
      , it "should be associative" <|
        \() -> (1 + 2) + 3 == 1 + (2 + 3)
    ]
    , describe "Multiplication"
    [
      it "should multiply two positive numbers" <|
        \() -> 2 * 3  == 6
      , it "should be commutative" <|
        \() -> 2 * 3  == 3 * 2
      , it "should be associative" <|
        \() -> (2 * 3) * 4 == 2 * (3 * 4)
    ]
    , describe "Subtraction"
    [
      it "should subtract two  numbers" <|
        \() -> 2 - 3  == -1
      , it "should be commutative?" <| -- Failing test, subtraction is not commutative!
        \() -> 2 - 3  == 3 - 2
      , it "should be associative?" <| -- Failing test, subtraction is not associative!
        \() -> (2 - 3) - 4 == 2 - (3 - 4)
    ]
  ]

main : Html msg
main =
  runAll all