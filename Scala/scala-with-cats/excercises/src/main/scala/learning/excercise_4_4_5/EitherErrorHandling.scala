package learning.excercise_4_4_5

import cats.syntax.either._

sealed trait AppError extends Product with Serializable

final case class CalculationError(message: String) extends AppError

final case class UnexpectedError(message: String) extends AppError

object App {

  type Result[A] = Either[AppError, A]

  implicit final class ResultOps[A](val value: A) {

    def asResult[A]: Result[A] = Either.asRight[AppError](value)
  }

  def divide[A <: Number, B <: Number](x: A, y: B): Either[AppError, Double] = {
    if (y == 0) {
      CalculationError("Cannot divide by 0").asLeft[Double]
    } else {
      (x.doubleValue / y.doubleValue).asRight[CalculationError]
    }
  }

  def multiply[A <: Number, B <: Number](x: A, y: B): Either[AppError, Double] = {
    (x.doubleValue * y.doubleValue).asInstanceOf[A].asRight[CalculationError]
  }
}
