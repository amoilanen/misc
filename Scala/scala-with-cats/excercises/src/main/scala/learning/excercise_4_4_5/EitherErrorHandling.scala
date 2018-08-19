package learning.excercise_4_4_5

import cats.syntax.either._

sealed trait AppError extends Product with Serializable

final case class CalculationError(message: String) extends AppError

final case class UnexpectedError(message: String) extends AppError

object App {

  type Result[A] = Either[AppError, A]

  implicit final class ResultOps[A](val value: A) {

    def asResult: Result[A] = value.asRight[AppError]
  }

  def divide(x: Double, y: Double): Either[AppError, Double] = {
    if (y == 0) {
      CalculationError("Cannot divide by 0").asLeft[Double]
    } else {
      (x / y).asRight[CalculationError]
    }
  }

  def multiply(x: Double, y: Double): Either[AppError, Double] = {
    (x * y).asRight[AppError]
  }
}
