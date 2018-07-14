package learning.excercise_1_3

import org.scalatest.WordSpec
import org.scalatest._
import PrintableInstances._

class PrintableSpec extends WordSpec with Matchers {

  "format" when {
    "int" should {
      "print" in {
        Printable.format(123) shouldEqual "123"
      }
    }
    "string" should {
      "print" in {
        Printable.format("abc") shouldEqual "abc"
      }
    }
  }
}

