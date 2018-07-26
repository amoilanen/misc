package learning.excercise_2_5_4

import cats.Monoid
import cats.syntax.semigroup._

object SuperAdder {

  def add[A: Monoid](items: List[A]): A =
    items.foldLeft(Monoid[A].empty) {
      (x, y) => x |+| y
    }
}
