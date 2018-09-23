package learning.case_study_data_validation

import cats.data.Validated
import cats.Semigroupal
import cats.Semigroup
import cats.syntax.semigroupal._

object Validation {

  trait Check[E, A] { self =>

    def apply(value: A): Validated[E, A]

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

    // other methods...
  }


}
