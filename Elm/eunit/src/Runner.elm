module Runner exposing (runAll)

import Html exposing (..)
import Html.Attributes exposing (..)
import List exposing (..)

import Test exposing (..)
import CssStyles exposing (..)

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
    testReportTitle = if suiteStats.failed > 0 then
      h3 [class "fail"] [text("Tests failed!")]
    else
      h3 [] [text("All tests passed")]
    htmlReport = runnerResult.report
  in
    div []
      [
        commonCssStyles
        , testReportTitle
        , h4 [] [text(statusString)]
        , htmlReport
      ]