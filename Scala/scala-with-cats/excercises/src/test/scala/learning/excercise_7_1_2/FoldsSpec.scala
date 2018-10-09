package learning.excercise_7_1_2

import org.scalatest._

class FoldsSpec extends WordSpec with Matchers {

  "empty accumulator and cons ::" should {

    val list = List(1, 2, 3, 4, 5)

    "foldLeft produce list in reverse order" in {
      list.foldLeft(List[Int]()) { (acc: List[Int], e: Int) =>
        e :: acc
      } shouldEqual list.reverse
    }

    "foldRight produce list in order" in {
      list.foldRight(List[Int]()) { (e: Int, acc: List[Int]) =>
        e :: acc
      } shouldEqual list
    }
  }
}
