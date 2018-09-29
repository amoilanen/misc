package learning.case_study_data_validation

import org.scalatest.{WordSpec, _}
import cats.data.NonEmptyList
import cats.data.Validated._
import Validation._

class ValidationSpec extends WordSpec with Matchers {

  type Errors = NonEmptyList[String]

  def error(s: String): NonEmptyList[String] =
    NonEmptyList(s, Nil)

  def errors(first: String, rest: String*): NonEmptyList[String] =
    NonEmptyList(first, rest.toList)


  def longerThan(n: Int): Predicate[Errors, String] =
    Predicate.lift(
      error(s"Must be longer than $n characters"),
      str => str.size > n)

  val alphanumeric: Predicate[Errors, String] =
    Predicate.lift(
      error(s"Must be all alphanumeric characters"),
      str => str.forall(_.isLetterOrDigit))

  def contains(char: Char): Predicate[Errors, String] =
    Predicate.lift(
      error(s"Must contain the character $char"),
      str => str.contains(char))

  def containsOnce(char: Char): Predicate[Errors, String] =
    Predicate.lift(
      error(s"Must contain the character $char only once"),
      str => str.filter(c => c == char).size == 1)

  "username validation" should {

    val minimumCharacters = 4
    val userNameValidation = alphanumeric.and(longerThan(minimumCharacters))

    s"should be valid when consists of at least $minimumCharacters alphanumeric characters" in {
      userNameValidation("Edward") shouldEqual Valid("Edward")
    }

    "should be invalid if contains non-alphanumeric characters" in {
      userNameValidation("@Edward") shouldEqual Invalid(error("Must be all alphanumeric characters"))
    }

    "should be invalid if too short" in {
      userNameValidation("Ed") shouldEqual Invalid(error(s"Must be longer than $minimumCharacters characters"))
    }

    "should be invalid if both too short and contains non-alphanumeric characters" in {
      userNameValidation("@#") shouldEqual Invalid(
        errors(
          "Must be all alphanumeric characters",
          s"Must be longer than $minimumCharacters characters"
        )
      )
    }
  }

  //email validation
}