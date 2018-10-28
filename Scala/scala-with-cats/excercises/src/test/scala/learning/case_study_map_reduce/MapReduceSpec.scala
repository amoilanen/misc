package learning.case_study_map_reduce

import org.scalatest.{Matchers, WordSpec}

import cats.instances.int._
import cats.instances.string._
import MapReduce._

class MapReduceSpec extends WordSpec with Matchers {

  "foldMap" should {

    "should work with a vector of Integers" in {
      foldMap(Vector(1, 2, 3))(identity) shouldEqual 6
    }

    "should work with a vector of Strings" in {
      foldMap(Vector(1, 2, 3))(_.toString + "! ") shouldEqual "1! 2! 3! "
    }
  }
}
