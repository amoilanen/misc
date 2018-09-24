package learning

object SimplifiedMonadClassHierarchy {

  //Aka "Cartesian"
  trait Semigroupal[F[_]] {

    def product[A, B](fa: F[A], fb: F[B]): F[(A, B)]
  }

  trait Functor[F[_]] {

    def map[A, B](fa: F[A])(f: A => B): F[B]
  }

  /*
   * Defines product in terms of ap and map
   */
  trait Apply[F[_]] extends Semigroupal[F] with Functor[F] {

    def ap[A, B](ff: F[A => B])(fa: F[A]): F[B]

    override def product[A, B](fa: F[A], fb: F[B]): F[(A, B)] =
      ap(map(fa)(a => (b: B) => (a, b)))(fb)
  }

  trait Applicative[F[_]] extends Apply[F] {

    def pure[A](a: A): F[A]
  }

  trait FlatMap[F[_]] {

    def flatMap[A, B](fa: F[A])(f: A => F[B]): F[B]
  }

  /*
   * Defines ap, product, map in terms of pure and flatMap
   */
  trait Monad[F[_]] extends Applicative[F] with FlatMap[F] {

    override def ap[A, B](ff: F[A => B])(fa: F[A]): F[B] =
      flatMap(ff)(f => map(fa)(f))

    override def product[A, B](fa: F[A], fb: F[B]): F[(A, B)] =
      flatMap(fa) { a =>
        map(fb) { b =>
          (a, b)
        }
      }

    override def map[A, B](fa: F[A])(f: A => B): F[B] =
      flatMap(fa)(f.andThen(pure))
  }
}