package learning.excercise_6_3_1_1

import cats.Monad
import cats.syntax.functor._
import cats.syntax.flatMap._

object ProductViaFlatMap {

  def product[M[_]: Monad, A, B](ma: M[A], mb: M[B]): M[(A, B)] =
    for {
      a <- ma
      b <- mb
    } yield (a, b)

}
