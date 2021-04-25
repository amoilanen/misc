package ch4

object Sudoku {

  val ValueToFillInPlaceholder = 0

  case class SudokuGrid(cells: Array[Array[Int]]) {
    val Size = cells.length
    val SubSize = Math.sqrt(Size).ceil.toInt
    val SquareIndices = Range(0, Size)
    val SubSquareIndices = Range(0, SubSize)

    def haveDistinctFilledInValues(values: Array[Int]): Boolean = {
      val filledInValues = values.filter(_ != ValueToFillInPlaceholder)
      filledInValues.distinct.size == filledInValues.size
    }

    def rowCells(rowIndex: Int): Array[Int] =
      cells(rowIndex)

    def columnCells(columnIndex: Int): Array[Int] =
      SquareIndices.map(cells(_)(columnIndex)).toArray

    def subSquareCells(rowIndex: Int, columnIndex: Int): Array[Array[Int]] = {
      val rowIndexOffset = rowIndex * SubSize
      val columnIndexOffset = columnIndex * SubSize
      SubSquareIndices.map(subGridRowIndex =>
        SubSquareIndices.map(subGridColumnIndex =>
          cells(rowIndexOffset + subGridRowIndex)(columnIndexOffset + subGridColumnIndex)
        ).toArray
      ).toArray
    }

    def areRowsValid(): Boolean =
      SquareIndices.forall(rowIndex =>
        haveDistinctFilledInValues(rowCells(rowIndex)))

    def areColumnsValid(): Boolean =
      SquareIndices.forall(columnIndex =>
        haveDistinctFilledInValues(columnCells(columnIndex)))

    def areSubGridsValid(): Boolean =
      SubSquareIndices.forall(rowIndex =>
        SubSquareIndices.forall(columnIndex =>
          haveDistinctFilledInValues(subSquareCells(rowIndex, columnIndex).flatten)))

    def isValid(): Boolean =
      areRowsValid() && areColumnsValid() && areSubGridsValid()
  }

  def isValidSudoku(grid: Array[Array[Int]]): Boolean =
    SudokuGrid(grid).isValid()
}
