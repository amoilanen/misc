package learning.excercise_1_4_6

import cats.Show
import cats.syntax.show._
import Cat._
import org.scalatest.{WordSpec, _}

class CatSpec extends WordSpec with Matchers {

  "Cat" should {
    "format" in {
      val cat = Cat("Missa", 5, "gray")

      cat.show shouldEqual "Missa is a 5 year-old gray cat."
      (new Show.ToShowOps {}).toShow(cat).show shouldEqual "Missa is a 5 year-old gray cat."
    }
  }
}
