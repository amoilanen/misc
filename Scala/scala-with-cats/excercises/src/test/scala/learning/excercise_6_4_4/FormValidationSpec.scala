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

  "parseInt" should {

    "should parse number successfully" in {
      parseInt("10") shouldEqual Right(10)
    }

    "should return left if not a number" in {
      parseInt("e") shouldEqual Left(List("Not a number"))
    }
  }

  "nonBlank" should {

    "should be successful for non empty value" in {
      nonBlank("abc") shouldEqual Right("abc")
    }

    "should return left for empty value" in {
      nonBlank("") shouldEqual Left(List("Is empty"))
    }
  }

  "nonNegative" should {

    "should be successful for non empty value" in {
      nonNegative(10) shouldEqual Right(10)
    }

    "should return left for empty value" in {
      nonNegative(-5) shouldEqual Left(List("Is negative"))
    }
  }
}