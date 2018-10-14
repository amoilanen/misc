package learning.excercise_7_2_2

import cats.data.Validated
import cats.data.Validated._
import org.scalatest._
import cats.instances.vector._ // for Applicative
import cats.instances.option._ // for Applicative
import cats.instances.list._ // for Applicative

import TraverseInstances._
import Traverse._

class TraverseTypesSpec extends WordSpec with Matchers {

  "vector" should {

    "should return cartesian product when two vectors" in {
      sequence(List(Vector(1, 2), Vector(3, 4))) shouldEqual
        Vector(List(1, 3), List(1, 4), List(2, 3), List(2, 4))
    }

    "should return cartesian product when three vectors" in {
      sequence(List(Vector(1, 2), Vector(3, 4), Vector(5, 6))) shouldEqual
        Vector(List(1, 3, 5), List(1, 3, 6), List(1, 4, 5), List(1, 4, 6),
               List(2, 3, 5), List(2, 3, 6), List(2, 4, 5), List(2, 4, 6))
    }
  }

  "option" should {

    def process(inputs: List[Int]): Option[List[Int]] =
      traverse(inputs)(n => if(n % 2 == 0) Some(n) else None)

    "should return None if contains odd numbers" in {
      process(List(1, 2, 3, 4, 5)) shouldEqual None
    }

    "should return list wrapped in option if all numbers are even" in {
      process(List(2, 4)) shouldEqual Some(List(2, 4))
    }
  }

  "validated" should {

    type ErrorsOr[A] = Validated[List[String], A]

    def process(inputs: List[Int]): ErrorsOr[List[Int]] =
      traverse(inputs) { n =>
        if(n % 2 == 0) {
          Validated.valid(n)
        } else {
          Validated.invalid(List(s"$n is not even"))
        }
      }

    "wraps list with all even numbers into Valid" in {
      process(List(2, 4, 6)) shouldEqual Valid(List(2, 4, 6))
    }

    "wraps list containing odd numbers into Invalid with these numbers" in {
      process(List(1, 2, 3)) shouldEqual Invalid(List("1 is not even", "3 is not even"))
    }
  }
}