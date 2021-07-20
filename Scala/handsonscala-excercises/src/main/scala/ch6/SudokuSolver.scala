package ch6

object SudokuSolver {

  val PlaceholderValue = 0

  case class SudokuGrid(cells: Array[Array[Int]]) {
    val Size = cells.length
    val SubSize = Math.sqrt(Size).ceil.toInt
    val SquareIndices = Range(0, Size)
    val SubSquareIndices = Range(0, SubSize)

    def haveDistinctFilledInValues(values: Array[Int]): Boolean = {
      val filledInValues = values.filter(_ != PlaceholderValue)
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

    def areRowsValid: Boolean =
      SquareIndices.forall(rowIndex =>
        haveDistinctFilledInValues(rowCells(rowIndex)))

    def areColumnsValid: Boolean =
      SquareIndices.forall(columnIndex =>
        haveDistinctFilledInValues(columnCells(columnIndex)))

    def areSubGridsValid: Boolean =
      SubSquareIndices.forall(rowIndex =>
        SubSquareIndices.forall(columnIndex =>
          haveDistinctFilledInValues(subSquareCells(rowIndex, columnIndex).flatten)))

    def isValid: Boolean =
      areRowsValid && areColumnsValid && areSubGridsValid

    def show: String =
      cells.map(_.mkString(",")).mkString("\n")


    def solve: Option[SudokuGrid] = {
      val validGrids = (0 until Size).toList.foldLeft(List(this))({ case (possiblyValidGrids, rowIdx) =>
        possiblyValidGrids.flatMap(_.tryFillingOutRow(rowIdx))
      })
      validGrids.headOption
    }

    private def tryFillingOutRow(rowIdx: Int): List[SudokuGrid] = {
      val row = cells(rowIdx)
      val filledOutRowValues = row.filter(_ > 0).toSet
      val availableValues = (1 to Size).toSet.diff(filledOutRowValues).toList

      val potentiallyValidRowVariants = permutationsOf(availableValues).map(availableValuesPermutation =>
        (0 until Size).foldLeft((List[Int](), availableValuesPermutation))({
          case ((updatedRow, updatedAvailableValues), cellIdx) =>
            val cellValue = row(cellIdx)
            if (cellValue == 0)
              (updatedRow :+ updatedAvailableValues.head, updatedAvailableValues.tail)
            else
              (updatedRow :+ cellValue, updatedAvailableValues)
        })._1
      )
      val potentiallyValidGridsWithFilledOutRow = potentiallyValidRowVariants.map(row =>
        SudokuGrid(cells.updated(rowIdx, row.toArray))
      ).filter(_.isValid)

      potentiallyValidGridsWithFilledOutRow
    }
  }

  def isValidSudoku(grid: Array[Array[Int]]): Boolean =
    SudokuGrid(grid).isValid

  def permutationsOf(values: List[Int]): List[List[Int]] =
    if (values.isEmpty)
      List(List())
    else
      (0 until values.size).toList.flatMap(idx => {
        val value = values(idx)
        val restOfValues = values.slice(0, idx) ++ values.slice(idx + 1, values.size)
        permutationsOf(restOfValues).map(_ :+ value)
      })
}
