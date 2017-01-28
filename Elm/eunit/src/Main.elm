import Html exposing (..)
import Html.Attributes exposing (..)
import List exposing (..)

-- TODO: Report results in other ways? Like a value that will contained passed, failed fields, etc.
-- Different runners? Command line runner?

-- TODO: Re-factor parts, extract modules, provide examples, publish the package

-- Constructing the test tree

type alias Expectation = {
  errorMessage: String,
  check: () -> Bool
}
type Test = Suite String (List Test) | Test String Expectation

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

it: String -> Expectation -> Test
it message expectation =
  Test message expectation

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
      .fail:before {
        content: "x - ";
      }
      .errorMessage {
        font-style: italic;
        font-size: 0.8rem;
        margin-left: 1rem;
        margin-bottom: 1rem;
      }
    """
  in node "style" [] [text(styleContent)]


-- Runner (generate result HTML from the test tree)
type alias SuiteStats =
  { passed: Int
   , failed: Int
  }

type alias RunnerResult msg =
  { suiteStats: SuiteStats
    , report: Html msg 
  }

run: Test -> RunnerResult msg
run test =
  case test of
    (Suite description tests) ->
      let
        childResults = List.map run tests
        childReports = List.map .report childResults
        suiteStats = childResults
          |> List.map .suiteStats
          |> List.foldl
               (\stats total ->
                 SuiteStats (stats.passed + total.passed) (stats.failed + total.failed)
               )
               (SuiteStats 0 0)
        suiteReport = div [class "describe"] ([text(description)] ++ childReports)
      in
        RunnerResult suiteStats suiteReport
    (Test description expectation) ->
      let
        hasPassed = expectation.check()
        testClass = if hasPassed then
          "pass"
        else
          "fail"
        testStats = if hasPassed then
          SuiteStats 1 0
        else
          SuiteStats 0 1
        testDetails = if hasPassed then
          [text(description)]
        else
          [text(description), div [class "errorMessage"] [text(expectation.errorMessage)]]
        testReport = (div [class testClass] testDetails)
      in
        RunnerResult testStats testReport

runAll: Test -> Html msg
runAll test =
  let
    runnerResult = run test
    suiteStats = runnerResult.suiteStats
    statusString = String.join " " ["Passed: ", toString suiteStats.passed,
                                  "Failed: ", toString suiteStats.failed]
    htmlReport = runnerResult.report
  in
    div []
      [
        commonCssStyles
        , h3 [] [text("Test results")]
        , h4 [] [text(statusString)]
        , htmlReport
      ]

-- Test example
all : Test
all = describe "Arithmetic operations"
  [ describe "Plus"
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