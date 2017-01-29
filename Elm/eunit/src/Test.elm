module Test exposing (Test(..), it, describe)

import Expectation exposing (Expectation)

type Test = Suite String (List Test) | Test String Expectation

it: String -> Expectation -> Test
it message expectation =
  Test message expectation

describe: String -> List Test -> Test
describe description suites =
  Suite description suites