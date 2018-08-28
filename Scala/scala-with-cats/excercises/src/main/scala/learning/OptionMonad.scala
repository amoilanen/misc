package learning

import cats.Monad
import scala.annotation.tailrec

object OptionMonad extends App {

  val optionMonad = new Monad[Option] {

    def flatMap[A, B](opt: Option[A])(fn: A => Option[B]): Option[B] =
      opt.flatMap(fn)

    def pure[A](value: A): Option[A] =
      Some(value)

    @tailrec
    def tailRecM[A, B](value: A)
                      (fn: A => Option[Either[A, B]]): Option[B] =
      fn(value) match {
        case None => None
        case Some(Left(error)) => tailRecM(error)(fn)
        case Some(Right(result)) => Some(result)
      }
  }

}
