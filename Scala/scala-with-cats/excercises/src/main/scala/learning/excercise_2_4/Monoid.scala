package learning.excercise_2_4

trait Semigroup[A] {
  def combine(x: A, y: A): A
}

trait Monoid[A] extends Semigroup[A] {
  def empty: A
}

object Monoid {

  def apply[A](implicit monoid: Monoid[A]) = monoid
}

object SetMonoid {

  implicit def setMonoid[A]: Monoid[Set[A]] =
    new Monoid[Set[A]] {

      override def empty: Set[A] = Set.empty[A]

      override def combine(x: Set[A], y: Set[A]): Set[A] = x.union(y)
    }
}
