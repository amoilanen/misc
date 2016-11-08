package sorting

import org.scalatest.FunSuite
import org.junit.runner.RunWith
import org.scalatest.junit.JUnitRunner
import sorting.Sorting._

@RunWith(classOf[JUnitRunner])
class SortingSuite extends FunSuite {

  test("bubble sort") {
    assert(bubbleSort(List(3, 2, 4, 1, 5)) === List(1, 2, 3, 4, 5))
  }

  test("quick sort") {
    assert(quickSort(List(3, 2, 4, 1, 5)) === List(1, 2, 3, 4, 5))
  }

  test("merge sort") {
    assert(mergeSort(List(3, 2, 4, 1, 5)) === List(1, 2, 3, 4, 5))
  }
}

