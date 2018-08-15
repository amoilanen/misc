package learning.excercise_4_3_1

import cats.Monad

import scala.annotation.tailrec

object IdMonad {

  type Id[A] = A

  implicit object IdMonad extends Monad[Id] {

    override def pure[A](a: A): Id[A] = a

    override def flatMap[A, B](value: Id[A])(func: A => Id[B]): Id[B] = func(value)

    override def map[A, B](value: Id[A])(func: A => B): Id[B] = func(value)

    @tailrec
    override def tailRecM[A, B](value: A)(func: A => Id[Either[A, B]]): Id[B] = func(value) match {
      case Left(_) => tailRecM[A, B](value)(func)
      case Right(result) => result
    }
  }
}