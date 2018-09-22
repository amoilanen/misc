package learning.excercise_6_4_4

import cats.data.Validated
import cats.syntax.either._
import cats.syntax.apply._
import cats.instances.list._

import scala.util.Try

object FormValidation {

  type ValidatedField[A] = Validated[List[String], A]

  case class User(name: String, age: Int)

  def readUser(fields: Map[String, String]): ValidatedField[User] = {
    (
      readName(fields),
      readAge(fields)
    ).tupled.map((User.apply _).tupled)
  }

  def readName(fields: Map[String, String]): ValidatedField[String] = {
    val either = for {
      name <- getValue(fields, "name")
      _ <- nonBlank(name, "name")
    } yield name
    Validated.fromEither(either)
  }

  def readAge(fields: Map[String, String]): ValidatedField[Int] = {
    val either = for {
      age <- getValue(fields, "age")
      parsedAge <- parseInt(age, "age")
      _ <- nonNegative(parsedAge, "age")
    } yield parsedAge
    Validated.fromEither(either)
  }

  def getValue(params: Map[String, String], name: String): Either[List[String], String] =
    params.get(name).fold(
      List(s"$name is not specified").asLeft[String]
    )(
      _.asRight[List[String]]
    )

  def parseInt(value: String, fieldName: String = ""): Either[List[String], Int] =
    Try(value.toInt).toEither.bimap(_ => List(s"$fieldName is not a number".trim), identity)

  def nonBlank(value: String, fieldName: String = ""): Either[List[String], String] =
    if (value.length > 0)
      value.asRight[List[String]]
    else
      List(s"$fieldName is empty".trim).asLeft[String]

  def nonNegative(value: Int, fieldName: String = ""): Either[List[String], Int] =
    if (value > 0)
      value.asRight[List[String]]
    else
      List(s"$fieldName is negative".trim).asLeft[Int]
}
