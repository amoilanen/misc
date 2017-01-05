import Html exposing (text)
import List exposing (filter)

main : Html.Html msg
main =
  text(toString(quickSort([9, 8, 2, 6, 10, 3, 1, 5, 7, 4])))

quickSort : List Int -> List Int
quickSort list =
  case list of
    [] ->
      []
    first :: rest ->
      quickSort
        (filter (\y -> y <= first) rest)
      ++
      [first]
      ++
      quickSort
        (filter (\y -> y > first) rest)