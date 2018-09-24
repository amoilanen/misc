package learning.case_study_data_validation

import cats.data.Validated
import cats.data.Validated._
import cats.Semigroupal
import cats.Semigroup

object Validation {

  trait Check[E, A] { self =>

    type ValidatedValue[A] = Validated[E, A]

    def apply(value: A): ValidatedValue[A]

    def map[B](check: Check[E, A])(func: A => B): Check[E, B]= ???

    def and(that: Check[E, A])(implicit me: Semigroup[E]): Check[E, A] = new Check[E, A] {

      def apply(value: A): Validated[E, A] = {
        val validationResult = Semigroupal.tuple2(
          self(value),
          that(value)
        )
        validationResult.map({
          case (_, _) => value
        })
      }
    }

    def or(that: Check[E, A])(implicit me: Semigroup[E]): Check[E, A] = new Check[E, A] {

      override def apply(value: A): ValidatedValue[A] = {
        self(value) match {
          case Valid(selfValid) => Valid(selfValid)
          case Invalid(selfError) => {
            that(value) match {
              case Valid(thatValid) => Valid(thatValid)
              case Invalid(thatError) => Invalid(me.combine(selfError, thatError))
            }
          }
        }
      }
    }
  }


}
