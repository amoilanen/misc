package learning.excercise_6_3_1_1

import cats.Monad

object ProductViaFlatMap {

  def product[M[_]: Monad, A, B](ma: M[A], mb: M[B]): M[(A, B)] =
    Monad[M].flatMap(ma) {a =>
      Monad[M].map(mb) {b =>
        (a, b)
      }
    }

}
