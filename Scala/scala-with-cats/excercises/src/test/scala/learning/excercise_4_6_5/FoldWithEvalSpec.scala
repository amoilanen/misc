package learning.excercise_4_6_5

import org.scalatest.{Matchers, WordSpec}

import FoldWithEval._

class FoldWithEvalSpec extends WordSpec with Matchers {

  "fold" should {

    "work for list of 3 elements" in {
      val list = List(1, 2, 3)
      foldRight(list, 0) {
        (acc, current) => acc + current
      } shouldEqual 6
    }

    "should not cause StackOverflowError with too many elements" in {
      val largeNumber = 500000
      val list = (1 to largeNumber).toList

      val expectedSum = (largeNumber + 1) * largeNumber / 2
      foldRight(list, acc = 0) {
        (acc, current) => acc + current
      } shouldEqual expectedSum
    }
  }
}
