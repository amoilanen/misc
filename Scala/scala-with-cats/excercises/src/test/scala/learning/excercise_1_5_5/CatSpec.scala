package learning.excercise_1_5_5

import cats.syntax.eq._

import org.scalatest.{WordSpec, _}

class CatSpec extends WordSpec with Matchers {

  val cat1 = Cat("Garfield", 38, "orange and black")
  val cat2 = Cat("Heathcliff", 33, "orange and black")

  "Cat equality" should {
    "compare two cats" in {
      (cat1 === cat2) shouldBe false
    }

    "compare non-empty cat and empty cat" in {
      val optionCat1 = Option(cat1)
      val optionCat2 = Option.empty[Cat]

      (optionCat1 === optionCat2) shouldBe false
    }
  }
}
