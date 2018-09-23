package learning.case_study_data_validation

import cats.Monoid

object Validation {

  trait Check[E, A] { self =>

    def apply(value: A): Either[E, A]

    def and(that: Check[E, A])(implicit m: Monoid[E]): Check[E, A] = new Check[E, A] {

      def apply(value: A): Either[E, A] = {
        val selfResult = self(value)
        val thatResult = that(value)
        (selfResult, thatResult) match {
          case (Left(selfError), Left(thatError)) => Left(m.combine(selfError, thatError))
          case (Left(selfError), Right(_)) => Left(selfError)
          case (Right(_), Left(thatError)) => Left(thatError)
          case (Right(_), Right(_)) => Right(value)
        }
      }
    }

    // other methods...
  }


}
