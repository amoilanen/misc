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

  "email validation" should {

    val splitEmailByAtSign: Check[NonEmptyList[String], String, (String, String)] = Check.lift(error("Should contain @ sign"), (value: String) => {
      val atSignIndex = value.indexOf('@')
      if (atSignIndex >= 0) {
        val leftPart = value.substring(0, atSignIndex)
        val rightPart = value.substring(atSignIndex + 1)
        Some((leftPart, rightPart))
      } else {
        None
      }
    })

    val validateEmailLeftPart: Predicate[Errors, String] = longerThan(0)
    val validateEmailRightPart: Predicate[Errors, String] = longerThan(3).and(contains('.'))

    val checkLeftEmailPart: Check[Errors, (String, String), (String, String)] = Check.pure(
      (emailParts: (String, String)) => {
        val (left, _) = emailParts
        validateEmailLeftPart(left).leftMap(errors => errors.map("Left part: " ++ _)).map(_ => emailParts)
      }
    )

    val checkRightEmailPart: Check[Errors, (String, String), (String, String)] = Check.pure(
      (emailParts: (String, String)) => {
        val (_, right) = emailParts
        validateEmailRightPart(right).leftMap(errors => errors.map("Right part: " ++ _)).map(_ => emailParts)
      }
    )

    def joinEmailParts(emailParts: (String, String)): String = {
      val (left, right) = emailParts
      s"$left@$right"
    }

    val emailValidation: Check[NonEmptyList[String], String, String] = splitEmailByAtSign
      .andThen(checkLeftEmailPart)
      .andThen(checkRightEmailPart)
      .map(joinEmailParts(_))

    "valid email" in {
      emailValidation("john.smith@example.com") shouldEqual Valid("john.smith@example.com")
    }

    "invalid email" should {

      "no @ sign" in {
        emailValidation("john.smith") shouldEqual Invalid(errors("Should contain @ sign"))
      }

      "left part is empty" in {
        emailValidation("@example.com") shouldEqual Invalid(errors("Left part: Must be longer than 0 characters"))
      }

      "right part is too short and without a dot" in {
        emailValidation("john.smith@e") shouldEqual
          Invalid(errors("Right part: Must be longer than 3 characters", "Right part: Must contain the character ."))
      }

      "right part is long but does not contain a dot" in {
        emailValidation("john.smith@example") shouldEqual Invalid(errors("Right part: Must contain the character ."))
      }

      "just @ sign" in {
        emailValidation("@") shouldEqual Invalid(errors("Left part: Must be longer than 0 characters"))
      }
    }
  }
}