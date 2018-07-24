package learning.excercise_2_3

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

  def possibleBooleanValues: Seq[Boolean] = Seq(true, false)

  def booleanMonoidShould(implicit m: Monoid[Boolean]) = {

    import MonoidLaws._

    "have empty element" in {
      for {
        x <- possibleBooleanValues
      } yield
        verifyEmptyLawWith(x)
    }

    "be associative" in {
      for {
        x <- possibleBooleanValues
        y <- possibleBooleanValues
        z <- possibleBooleanValues
      } yield
        verifyAssociativityLawWith(x, y, z)
    }
  }

  "Boolean or monoid" should {

    import BooleanOrMonoid._
    booleanMonoidShould
  }

  "Boolean and monoid" should {

    import BooleanAndMonoid._
    booleanMonoidShould
  }
}