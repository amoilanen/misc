package ch4

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers
import Sudoku._

class SudokuSpec extends AnyFreeSpec with Matchers {

  "isValidSudoku" - {

    "filled out grids" - {

      "valid grid" in {
        isValidSudoku(Array(
          Array(5, 3, 4, 6, 7, 8, 9, 1, 2),
          Array(6, 7, 2, 1, 9, 5, 3, 4, 8),
          Array(1, 9, 8, 3, 4, 2, 5, 6, 7),
          Array(8, 5, 9, 7, 6, 1, 4, 2, 3),
          Array(4, 2, 6, 8, 5, 3, 7, 9, 1),
          Array(7, 1, 3, 9, 2, 4, 8, 5, 6),
          Array(9, 6, 1, 5, 3, 7, 2, 8, 4),
          Array(2, 8, 7, 4, 1, 9, 6, 3, 5),
          Array(3, 4, 5, 2, 8, 6, 1, 7, 9)
        )) shouldBe true
      }

      "invalid grid" in {
        isValidSudoku(Array(
          Array(5, 3, 4, 6, 7, 8, 9, 1, 2),
          Array(6, 7, 2, 1, 9, 5, 3, 4, 8),
          Array(1, 9, 8, 3, 4, 2, 5, 6, 7),
          Array(8, 5, 9, 7, 6, 1, 4, 2, 3),
          Array(4, 2, 6, 8, 5, 3, 7, 9, 1),
          Array(7, 1, 3, 9, 2, 4, 8, 5, 6),
          Array(9, 6, 1, 5, 3, 7, 2, 8, 4),
          Array(2, 8, 7, 4, 1, 9, 6, 3, 5),
          Array(3, 4, 5, 2, 8, 6, 1, 7, 8)
        )) shouldBe false
      }
    }

    "partially filled out grid" - {

      "valid grid" in {
        isValidSudoku(Array(
          Array(3, 1, 6, 5, 7, 8, 4, 9, 2),
          Array(5, 2, 9, 1, 3, 4, 7, 6, 8),
          Array(4, 8, 7, 6, 2, 9, 5, 3, 1),
          Array(2, 6, 3, 0, 1, 0, 0, 8, 0),
          Array(9, 7, 4, 8, 6, 3, 0, 0, 5),
          Array(8, 5, 1, 0, 9, 0, 6, 0, 0),
          Array(1, 3, 0, 0, 0, 0, 2, 5, 0),
          Array(0, 0, 0, 0, 0, 0, 0, 7, 4),
          Array(0, 0, 5, 2, 0, 6, 3, 0, 0)
        )) shouldBe true
      }

      "invalid grid" in {
        isValidSudoku(Array(
          Array(3, 1, 6, 5, 7, 8, 4, 9, 3),
          Array(5, 2, 9, 1, 3, 4, 7, 6, 8),
          Array(4, 8, 7, 6, 2, 9, 5, 3, 1),
          Array(2, 6, 3, 0, 1, 0, 0, 8, 0),
          Array(9, 7, 4, 8, 6, 3, 0, 0, 5),
          Array(8, 5, 1, 0, 9, 0, 6, 0, 0),
          Array(1, 3, 0, 0, 0, 0, 2, 5, 0),
          Array(0, 0, 0, 0, 0, 0, 0, 7, 4),
          Array(0, 0, 5, 2, 0, 6, 3, 0, 0)
        )) shouldBe false
      }
    }
  }
}
