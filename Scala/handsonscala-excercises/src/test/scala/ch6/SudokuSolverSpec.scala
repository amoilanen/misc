package ch6

import ch6.SudokuSolver.SudokuGrid
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class SudokuSolverSpec extends AnyFreeSpec with Matchers {

  "should find the solution for partially filled Sudoku" in {
    val puzzle =
      Array(
        Array(3, 0, 6, 5, 0, 8, 4, 0, 0),
        Array(5, 2, 0, 0, 0, 0, 0, 0, 0),
        Array(0, 8, 7, 0, 0, 0, 0, 3, 1),
        Array(0, 0, 3, 0, 1, 0, 0, 8, 0),
        Array(9, 0, 0, 8, 6, 3, 0, 0, 5),
        Array(0, 5, 0, 0, 9, 0, 6, 0, 0),
        Array(1, 3, 0, 0, 0, 0, 2, 5, 0),
        Array(0, 0, 0, 0, 0, 0, 0, 7, 4),
        Array(0, 0, 5, 2, 0, 6, 3, 0, 0))

    val solution =
      Array(
        Array(3, 1, 6, 5, 7, 8, 4, 9, 2),
        Array(5, 2, 9, 1, 3, 4, 7, 6, 8),
        Array(4, 8, 7, 6, 2, 9, 5, 3, 1),
        Array(2, 6, 3, 4, 1, 5, 9, 8, 7),
        Array(9, 7, 4, 8, 6, 3, 1, 2, 5),
        Array(8, 5, 1, 7, 9, 2, 6, 4, 3),
        Array(1, 3, 8, 9, 4, 7, 2, 5, 6),
        Array(6, 9, 2, 3, 5, 1, 8, 7, 4),
        Array(7, 4, 5, 2, 8, 6, 3, 1, 9))

    SudokuGrid(puzzle).solve.get.cells shouldEqual solution
  }
}
