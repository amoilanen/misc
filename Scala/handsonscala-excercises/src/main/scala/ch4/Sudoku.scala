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

    def render(): String = {
      val ExtendedSquareIndices = SquareIndices.toList :+ Size
      val verticalSeparator = ("+" + ("-" * (2 * SubSize + 1))) * SubSize + "+"
      val horizontalSeparator = "|"
      ExtendedSquareIndices.map(rowIndex => {
        val isBoundaryRow = rowIndex % SubSize == 0
        val rowPrefix = if (isBoundaryRow)
          verticalSeparator + "\n"
        else
          ""
        val rowRendition = if (rowIndex < Size) {
          Some(ExtendedSquareIndices.flatMap(columnIndex => {
            val isBoundaryColumn = columnIndex % SubSize == 0
            val columnPrefix = if (isBoundaryColumn) Some(horizontalSeparator) else None
            val cellValue = if (columnIndex < Size) Some(cells(rowIndex)(columnIndex)) else None
            val cellValueRendition = cellValue.map(v =>
              if (v == 0) " " else v)
            columnPrefix.toList ++ cellValueRendition.toList
          }).mkString(" "))
        } else None
        rowPrefix + rowRendition.toList.mkString
      }).mkString("\n")
    }
  }

  def isValidSudoku(grid: Array[Array[Int]]): Boolean =
    SudokuGrid(grid).isValid()

  def renderSudoku(grid: Array[Array[Int]]): String =
    SudokuGrid(grid).render()
}

object SudokuApp extends App {
  val grid = Array(
    Array(3, 1, 6, 5, 7, 8, 4, 9, 2),
    Array(5, 2, 9, 1, 3, 4, 7, 6, 8),
    Array(4, 8, 7, 6, 2, 9, 5, 3, 1),
    Array(2, 6, 3, 0, 1, 0, 0, 8, 0),
    Array(9, 7, 4, 8, 6, 3, 0, 0, 5),
    Array(8, 5, 1, 0, 9, 0, 6, 0, 0),
    Array(1, 3, 0, 0, 0, 0, 2, 5, 0),
    Array(0, 0, 0, 0, 0, 0, 0, 7, 4),
    Array(0, 0, 5, 2, 0, 6, 3, 0, 0)
  )
  println(Sudoku.renderSudoku(grid))
}