package learning

import cats.syntax.apply._
import cats.instances.option._
import cats.Semigroupal
import cats.data.Validated
import cats.syntax.validated._ // for valid and invalid
import cats.instances.vector._ // for Semigroupal
import cats.syntax.apply._

object SemigroupalDemo extends App {

  Semigroupal.tuple3(Option(1), Option(2), Option(3))

  val v = Validated.valid[List[String], Int](123)

  123.valid[List[String]]

  (Option(123), Option("abc")).tupled

  Validated.catchOnly[NumberFormatException]("foo".toInt)

  val x = (
    "abc".valid[Vector[String]],
    "def".valid[Vector[String]]
  ).tupled

  println(x)

}
