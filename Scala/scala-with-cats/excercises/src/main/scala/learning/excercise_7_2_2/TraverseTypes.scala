package learning.excercise_7_2_2

import scala.language.higherKinds
import cats.Applicative
import cats.syntax.applicative._
import cats.syntax.apply._

trait Traverse[F[_]] {

  def traverse[G[_]: Applicative, A, B](inputs: F[A])(func: A => G[B]): G[F[B]]

  def sequence[G[_]: Applicative, B](inputs: F[G[B]]): G[F[B]] =
    traverse(inputs)(identity)
}

object Traverse {

  def traverse[G[_]: Applicative, F[_]: Traverse, A, B](inputs: F[A])(func: A => G[B]): G[F[B]] =
    implicitly[Traverse[F]].traverse(inputs)(func)

  def sequence[G[_]: Applicative, F[_]: Traverse, B](inputs: F[G[B]]): G[F[B]] =
    implicitly[Traverse[F]].sequence[G, B](inputs)
}

object TraverseInstances {

  implicit val listTraverse = ListTraverse
}

object ListTraverse extends Traverse[List] {

  def traverse[G[_]: Applicative, A, B](list: List[A])(func: A => G[B]): G[List[B]] =
    list.foldLeft(List.empty[B].pure[G]) { (accum, item) =>
      (accum, func(item)).mapN(_ :+ _)
    }
}