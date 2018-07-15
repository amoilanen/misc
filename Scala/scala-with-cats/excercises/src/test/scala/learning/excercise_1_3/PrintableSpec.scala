package learning.excercise_1_3

import org.scalatest.WordSpec
import org.scalatest._
import PrintableInstances._

class PrintableSpec extends WordSpec with Matchers {

  "format" when {
    "int" should {
      "format" in {
        Printable.format(123) shouldEqual "123"
      }
    }
    "string" should {
      "format" in {
        Printable.format("abc") shouldEqual "abc"
      }
    }
    "Cat" should {
      "format" in {
        Printable.format(Cat("Missa", 5, "gray")) shouldEqual "Missa is a 5 year-old gray cat."
      }
    }
  }

  "interface syntax" when {

    import PrintableSyntax._

    "int" should {
      "format" in {
        123.format shouldEqual "123"
      }
    }
    "string" should {
      "format" in {
        // Explicit PrintableOps, otherwise name collision with StringLike.format
        new PrintableOps("abc").format shouldEqual "abc"
      }
    }
    "Cat" should {
      "format" in {
        Cat("Missa", 5, "gray").format shouldEqual "Missa is a 5 year-old gray cat."
      }
    }
  }
}

