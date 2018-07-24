package learning.excercise_2_4

import org.scalatest.{WordSpec, _}

class MonoidSpec extends WordSpec with Matchers {

  object MonoidLaws extends Matchers {

    def verifyAssociativityLawWith[A](x: A, y: A, z: A)(implicit m: Monoid[A]): Unit = {
      m.combine(x, m.combine(y, z)) shouldBe m.combine(m.combine(x, y), z)
    }

    def verifyEmptyLawWith[A](x: A)(implicit m: Monoid[A]): Unit = {
      m.combine(x, m.empty) shouldBe x
      m.combine(m.empty, x) shouldBe x
    }
  }

  "Set[String] monoid" should {

    import MonoidLaws._
    import SetMonoid._

    "have empty element" in {
      val x = Set("a", "b", "c")
      verifyEmptyLawWith(x)
    }

    "be associative" in {
      val x = Set("a", "b", "c")
      val y = Set("a", "d")
      val z = Set("b", "e")
      verifyAssociativityLawWith(x, y, z)
    }
  }

  "Set[Int] monoid" should {

    import MonoidLaws._
    import SetMonoid._

    "have empty element" in {
      val x = Set(1, 2, 3)
      verifyEmptyLawWith(x)
    }

    "be associative" in {
      val x = Set(1, 2, 3)
      val y = Set(1, 4)
      val z = Set(2, 5)
      verifyAssociativityLawWith(x, y, z)
    }
  }
}
