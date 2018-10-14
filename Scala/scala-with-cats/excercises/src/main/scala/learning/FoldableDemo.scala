package learning

import cats.Foldable
import cats.instances.list._
import cats.instances.int._

object FoldableDemo extends App {

  val ints = List(1, 2, 3)
  Foldable[List].foldLeft(ints, 0)(_ + _)

  import cats.syntax.foldable._ // for combineAll and foldMap
  List(1, 2, 3).combineAll
  // res16: Int = 6


}
