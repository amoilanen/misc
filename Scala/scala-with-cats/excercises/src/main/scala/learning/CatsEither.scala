package learning

import cats.syntax.either._

object CatsEither extends App {

  val a: Either[String, Int] = 3.asRight[String]

  val x = Either.catchOnly[NumberFormatException]("foo".toInt)

  println(x)
}
