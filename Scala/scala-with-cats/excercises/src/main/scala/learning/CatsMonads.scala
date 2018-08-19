package learning

import cats.instances.option._
import cats.instances.list._
import cats.syntax.applicative._

object CatsMonads extends App {

  1.pure[Option]
  1.pure[List]
}
