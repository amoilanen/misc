package learning.excercise_6_4_4

import cats.syntax.either._

import scala.util.Try

object FormValidation {

  case class User(name: String, age: Int)

  def readName(params: Map[String, String]): Either[List[String], String] =
    for {
      name <- getValue(params, "name")
      _ <- nonBlank(name)
    } yield name

  def readAge(params: Map[String, String]): Either[List[String], String] =
    for {
      age <- getValue(params, "age")
      parsedAge <- parseInt(age)
      _ <- nonNegative(parsedAge)
    } yield age

  def getValue(params: Map[String, String], name: String): Either[List[String], String] =
    params.get(name).fold(
      List(s"$name not found").asLeft[String]
    )(
      _.asRight[List[String]]
    )

  def parseInt(value: String): Either[List[String], Int] =
    Try(value.toInt).toEither.bimap(_ => List("Not a number"), identity)

  def nonBlank(value: String): Either[List[String], String] =
    if (value.length > 0)
      value.asRight[List[String]]
    else
      List("Is empty").asLeft[String]

  def nonNegative(value: Int): Either[List[String], Int] =
    if (value > 0)
      value.asRight[List[String]]
    else
      List("Is negative").asLeft[Int]
}
