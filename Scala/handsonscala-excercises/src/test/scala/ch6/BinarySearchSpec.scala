package ch6

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class BinarySearchSpec extends AnyFreeSpec with Matchers {

  import BinarySearch._

  "search" - {

    val start = 0
    val end = 100
    val elements = start to end

    "should find element in the sorted sequence" in {
      elements.foreach(element =>
        search(elements, element) shouldEqual(element)
      )
    }

    "should return -1 if element cannot be found" in {
      search(elements, end + 1) shouldEqual -1
    }
  }
}
