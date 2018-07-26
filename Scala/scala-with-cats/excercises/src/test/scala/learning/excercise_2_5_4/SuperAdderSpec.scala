package learning.excercise_2_5_4

import org.scalatest.{WordSpec, _}

import cats.instances.int._
import cats.instances.option._

class SuperAdderSpec extends WordSpec with Matchers {

  "SuperAdder" should {

    "add empty list of numbers" in {
      SuperAdder.add(List.empty[Int]) shouldEqual 0
    }

    "add list with only one number" in {
      SuperAdder.add(List(1)) shouldEqual 1
    }

    "add list of numbers" in {
      SuperAdder.add(List(1, 2, 3)) shouldEqual 6
    }

    "add list of options containing numbers" in {
      SuperAdder.add(List(Option(1), Option(2), Option(3), None)) shouldEqual Some(6)
    }

    "add orders" in {
      import Order._

      SuperAdder.add(List(Order(1, 2), Order(3, 4), Order(5, 6))) shouldEqual Order(9, 12)
    }
  }
}
