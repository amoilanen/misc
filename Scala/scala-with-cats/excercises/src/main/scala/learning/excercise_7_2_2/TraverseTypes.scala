package learning.excercise_7_2_2

import scala.language.higherKinds
import cats.Applicative
import cats.syntax.applicative._
import cats.syntax.apply._

object TraverseTypes {

  def listTraverse[F[_]: Applicative, A, B](list: List[A])(func: A => F[B]): F[List[B]] =
    list.foldLeft(List.empty[B].pure[F]) { (accum, item) =>
      (accum, func(item)).mapN(_ :+ _)
    }

  def listSequence[F[_]: Applicative, B](list: List[F[B]]): F[List[B]] =
    listTraverse(list)(identity)

}
