package learning

object SimplifiedMonadClassHierarchy {

  //Aka "Cartesian"
  trait Semigroupal[F[_]] {

    def product[A, B](fa: F[A], fb: F[B]): F[(A, B)]
  }

  trait Functor[F[_]] {

    def map[A, B](fa: F[A])(f: A => B): F[B]
  }

  trait Apply[F[_]] extends Semigroupal[F] with Functor[F] {

    def ap[A, B](ff: F[A => B])(fa: F[A]): F[B]

    def product[A, B](fa: F[A], fb: F[B]): F[(A, B)] =
      ap(map(fa)(a => (b: B) => (a, b)))(fb)
  }

  trait Applicative[F[_]] extends Apply[F] {
    def pure[A](a: A): F[A]
  }

  trait FlatMap[F[_]] {

    def flatMap[A, B](fa: F[A])(f: A => F[B]): F[B]
  }

  trait Monad[F[_]] extends Applicative[F] with FlatMap[F] {
  }
}