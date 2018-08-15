package learning.excercise_4_3_1

import cats.Monad
import IdMonad._

import org.scalatest.{WordSpec, _}

class IdSpec extends WordSpec with Matchers {

  "IdMonad" should {

    "pure" in {
      Monad[Id].pure(2) shouldEqual 2
    }

    "map" in {
      Monad[Id].map(1)(_ + 2) shouldEqual 3
    }

    "flatMap" in {
      Monad[Id].flatMap("abc")(_ + "def") shouldEqual "abcdef"
    }
  }
}
