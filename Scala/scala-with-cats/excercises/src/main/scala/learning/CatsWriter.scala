package learning

import cats.Id
import cats.data.{Writer, WriterT}
import cats.syntax.applicative._
import cats.syntax.writer._
import cats.instances.vector._

object CatsWriter extends App {

  type Logged[A] = Writer[Vector[String], A]

  val x: WriterT[Id, Vector[String], Int] = Writer(Vector("abc", "def"), 123)

  123.pure[Logged]

  val y: Writer[Vector[String], Unit] = Vector("abc", "def").tell
}
