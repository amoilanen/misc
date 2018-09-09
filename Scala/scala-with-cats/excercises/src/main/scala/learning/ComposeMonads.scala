package learning

import cats.Monad
import cats.instances.option._
import cats.syntax.applicative._
import scala.language.higherKinds

object ComposeMonads extends App {

  // Hypothetical example. This won't actually compile:
  def composeWithOption[M[_]: Monad] = {

    type Composed[A] = M[Option[A]]

    new Monad[Composed] {

      def pure[A](a: A): Composed[A] =
        a.pure[Option].pure[M]

      def flatMap[A, B](fa: Composed[A])
                       (f: A => Composed[B]): Composed[B] =
        Monad[M].flatMap(fa)(_.fold(Monad[M].pure(Option.empty[B]))(f))

      override def tailRecM[A, B](a: A)(f: A => Composed[Either[A, B]]): Composed[B] = ???
    }
  }


}
