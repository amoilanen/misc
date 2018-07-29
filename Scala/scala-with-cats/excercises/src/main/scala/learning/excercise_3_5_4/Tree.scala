package learning.excercise_3_5_4

import cats.Functor

sealed trait Tree[+A]

final case class Branch[A](left: Tree[A], right: Tree[A]) extends Tree[A]

final case class Leaf[A](value: A) extends Tree[A]

object Tree {

  implicit val treeFunctor: Functor[Tree] = new Functor[Tree] {
    override def map[A, B](fa: Tree[A])(f: A => B): Tree[B] =
      fa match {
        case Leaf(value) => Leaf(f(value))
        case Branch(left, right) => {
          Branch(map(left)(f), map(right)(f))
        }
      }
  }
}