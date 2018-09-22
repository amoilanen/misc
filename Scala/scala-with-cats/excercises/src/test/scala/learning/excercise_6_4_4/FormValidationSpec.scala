package learning.excercise_6_4_4

import cats.syntax.validated._

import org.scalatest.{WordSpec, _}
import FormValidation._

class FormValidationSpec extends WordSpec with Matchers {

  "getValue" should {

    val params = Map("a" -> "b", "c" -> "d")

    "should return right if value is defined" in {
      getValue(params, "a") shouldEqual Right("b")
    }

    "should return left is value is not defined" in {
      getValue(params, "e") shouldEqual Left(List("e is not specified"))
    }
  }

  "parseInt" should {

    "should parse number successfully" in {
      parseInt("10") shouldEqual Right(10)
    }

    "should return left if not a number" in {
      parseInt("e") shouldEqual Left(List("is not a number"))
    }
  }

  "nonBlank" should {

    "should be successful for non empty value" in {
      nonBlank("abc") shouldEqual Right("abc")
    }

    "should return left for empty value" in {
      nonBlank("") shouldEqual Left(List("is empty"))
    }
  }

  "nonNegative" should {

    "should be successful for non empty value" in {
      nonNegative(10) shouldEqual Right(10)
    }

    "should return left for empty value" in {
      nonNegative(-5) shouldEqual Left(List("is negative"))
    }
  }

  "readName" should {

    "fail if not specified" in {
      readName(Map()) shouldEqual List("name is not specified").invalid[String]
    }

    "fail if empty" in {
      readName(Map("name" -> "")) shouldEqual List("name is empty").invalid[String]
    }

    "succeed if valid name" in {
      readName(Map("name" -> "John")) shouldEqual "John".valid[List[String]]
    }
  }

  "readAge" should {

    "fail if not specified" in {
      readAge(Map()) shouldEqual List("age is not specified").invalid[Int]
    }

    "fail if not an integer" in {
      readAge(Map("age" -> "abc")) shouldEqual List("age is not a number").invalid[Int]
    }

    "fail if negative" in {
      readAge(Map("age" -> "-5")) shouldEqual List("age is negative").invalid[Int]
    }

    "succeed if valid age" in {
      readAge(Map("age" -> "5")) shouldEqual 5.valid[List[String]]
    }
  }

  "readUser" should {

    "accumulate errors if not valid" in {
      val fields = Map("name" -> "", "age" -> "ab")

      readUser(fields) shouldEqual List("name is empty", "age is not a number").invalid[User]
    }

    "read user if valid" in {
      val fields = Map("name" -> "John", "age" -> "5")

      readUser(fields) shouldEqual User("John", 5).valid[List[String]]
    }
  }
}