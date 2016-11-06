package sorting

import org.scalatest.FunSuite
import org.junit.runner.RunWith
import org.scalatest.junit.JUnitRunner
import sorting.Sorting._

@RunWith(classOf[JUnitRunner])
class SortingSuite extends FunSuite {

  test("first test") {
    assert(bubbleSort(List(3, 2, 4, 1, 5)) === List(1, 2, 3, 4, 5))
  }
}

