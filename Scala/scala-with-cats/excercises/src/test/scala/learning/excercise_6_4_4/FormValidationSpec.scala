package learning.excercise_6_4_4

import org.scalatest.{WordSpec, _}
import FormValidation._

class FormValidationSpec extends WordSpec with Matchers {

  "getValue" should {

    val params = Map("a" -> "b", "c" -> "d")

    "should return right if value is defined" in {
      getValue(params, "a") shouldEqual Right("b")
    }

    "should return left is value is not defined" in {
      getValue(params, "e") shouldEqual Left(List("e not found"))
    }
  }
}