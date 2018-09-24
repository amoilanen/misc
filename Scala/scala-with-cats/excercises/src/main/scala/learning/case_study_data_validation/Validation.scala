package learning.case_study_data_validation

import cats.data.Validated
import cats.data.Validated._
import cats.Semigroupal
import cats.Semigroup

object Validation {

  sealed trait Predicate[E, A] {

    type ValidatedValue[A] = Validated[E, A]

    def apply(value: A): ValidatedValue[A]

    def and(that: Predicate[E, A])(implicit me: Semigroup[E]): Predicate[E, A] = And(this, that)

    def or(that: Predicate[E, A]): Predicate[E, A] = Or(this, that)
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

    def apply(value: A): ValidatedValue[A] = func(value)
  }

  sealed trait Check[E, A, B] { self =>

    def apply(a: A): Validated[E, B]

    def map[C](func: B => C): Check[E, A, C] = MapCheck(self, func)

    def flatMap[C](func: B => Check[E, A, C]): Check[E, A, C] = FlatMapCheck(self, func)

    def andThen[C](that: Check[E, B, C]): Check[E, A, C] = AndThenCheck(self, that)

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
}
