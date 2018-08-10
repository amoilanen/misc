package learning.excercise_4_1_2

import org.scalatest.{ WordSpec, _}

class MonadSpec extends WordSpec with Matchers {

  object ListMonad extends Monad[List] {

    override def pure[A](a: A): List[A] = List(a)

    override final def flatMap[A, B](value: List[A])(func: A => List[B]): List[B] = value match {
      case head::tail => {
        val newHead: List[B] = func(head)

        newHead ++ flatMap(tail)(func)
      }
      case _ => List()
    }
  }

  "ListMonad" should {

    "flatMap" in {
      val x = List(1, 2, 3)
      ListMonad.flatMap(x)(e => (0 to e).toList) shouldEqual List(0, 1, 0, 1, 2, 0, 1, 2, 3)
    }

    "map" in {
      val x = List(1, 2, 3)
      ListMonad.map(x)(e => e * e) shouldEqual List(1, 4, 9)
    }
  }
}
