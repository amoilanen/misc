package learning.excercise_7_1_3

import org.scalatest._

import HighLevelSequenceOperationsThroughFold._

class HighLevelSequenceOperationsThroughFoldSpec extends WordSpec with Matchers {

  val l = List(1, 2, 3, 4, 5)

  "methods" should {

    "map defined through foldRight should be same as map" in {
      map(l)(_ * 2) shouldEqual l.map(_ * 2)
    }

    "flatMap defined through foldRight should be same as flatMap" in {
      flatMap(l)(List(_, 1)) shouldEqual l.flatMap(List(_, 1))
    }

    "filter defined through foldRight should be same as map" in {
      filter(l)(_  % 2 == 0) shouldEqual l.filter(_  % 2 == 0)
    }

    "sum defined through foldRight should be same as map" in {
      sum(l) shouldEqual l.sum
    }
  }
}