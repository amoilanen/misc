package learning.excercise_6_4_4

import cats.syntax.either._

object FormValidation {

  case class User(name: String, age: Int)

  def readName(params: Map[String, String]): Either[List[String], String] = ???

  def readAge(params: Map[String, String]): Either[List[String], String] = ???

  def getValue(params: Map[String, String], name: String): Either[List[String], String] =
    params.get(name).fold(
      List(s"$name not found").asLeft[String]
    )(
      _.asRight[List[String]]
    )
}
