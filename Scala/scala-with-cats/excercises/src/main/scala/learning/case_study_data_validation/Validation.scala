package learning.case_study_data_validation

import cats.data.Validated
import cats.data.Validated._
import cats.syntax.validated._
import cats.{Semigroup, Semigroupal}

object Validation {

  sealed trait Predicate[E, A] {

    type ValidatedValue[B] = Validated[E, B]

    def apply(value: A)(implicit me: Semigroup[E]): ValidatedValue[A]

    def and(that: Predicate[E, A]): Predicate[E, A] = And(this, that)

    def or(that: Predicate[E, A]): Predicate[E, A] = Or(this, that)
  }

  object Predicate {

    def pure[E, A](func: A => Validated[E, A]): Predicate[E, A] = Pure(func)

    def lift[E, A](error: E, func: A => Boolean): Predicate[E, A] = new Predicate[E, A] {

      override def apply(value: A)(implicit me: Semigroup[E]): ValidatedValue[A] =
        if (func(value)) {
          Valid(value)
        } else {
          Invalid(error)
        }
    }
  }

  final case class And[E, A](left: Predicate[E, A], right: Predicate[E, A]) extends Predicate[E, A] {

    def apply(value: A)(implicit me: Semigroup[E]): Validated[E, A] = {
      val validationResult = Semigroupal.tuple2(
        left(value),
        right(value)
      )
      validationResult.map({
        case (_, _) => value
      })
    }
  }

  final case class Or[E, A](left: Predicate[E, A], right: Predicate[E, A]) extends Predicate[E, A] {

    def apply(value: A)(implicit me: Semigroup[E]): ValidatedValue[A] = {
      left(value) match {
        case Valid(selfValid) => Valid(selfValid)
        case Invalid(selfError) => {
          right(value) match {
            case Valid(thatValid) => Valid(thatValid)
            case Invalid(thatError) => Invalid(me.combine(selfError, thatError))
          }
        }
      }
    }
  }

  final case class Pure[E, A](func: A => Validated[E, A]) extends Predicate[E, A] {

    def apply(value: A)(implicit me: Semigroup[E]): ValidatedValue[A] = func(value)
  }

  sealed trait Check[E, A, B] { self =>

    def apply(a: A): Validated[E, B]

    def map[C](func: B => C): Check[E, A, C] = MapCheck(self, func)

    def flatMap[C](func: B => Check[E, A, C]): Check[E, A, C] = FlatMapCheck(self, func)

    def andThen[C](that: Check[E, B, C]): Check[E, A, C] = AndThenCheck(self, that)
  }

  object Check {

    def pure[E, A, B](func: A => Validated[E, B]): Check[E, A, B] = PureCheck(func)

    def lift[E, A, B](error: E, func: A => Option[B]): Check[E, A, B] = new Check[E, A, B] {

      override def apply(value: A): Validated[E, B] =
        func(value).fold(error.invalid[B])(_.valid[E])
    }
  }

  final case class MapCheck[E, A, B, C](check: Check[E, A, B], func: B => C) extends Check[E, A, C] {

    def apply(a: A): Validated[E, C] =
      check(a).map(func)
  }

  final case class FlatMapCheck[E, A, B, C](check: Check[E, A, B], func: B => Check[E, A, C]) extends Check[E, A, C] {

    def apply(a: A): Validated[E, C] =
      check(a).map(func) match {
        case Invalid(error) => Invalid(error)
        case Valid(check) => check(a)
      }
  }

  final case class AndThenCheck[E, A, B, C](left: Check[E, A, B], right: Check[E, B, C]) extends Check[E, A, C] {

    def apply(a: A): Validated[E, C] =
      left(a) match {
        case Invalid(error) => Invalid(error)
        case Valid(b) => right(b)
      }
  }

  final case class PureCheck[E, A, B](check: A => Validated[E, B]) extends Check[E, A, B] {

    def apply(a: A): Validated[E, B] =
      check(a)
  }
}

object Main extends App {
  println("Main")
}