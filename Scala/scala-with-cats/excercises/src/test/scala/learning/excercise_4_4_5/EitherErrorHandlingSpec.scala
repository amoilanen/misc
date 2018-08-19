package learning.excercise_4_4_5

import org.scalatest.{Matchers, WordSpec}
import App._

class EitherErrorHandlingSpec extends WordSpec with Matchers  {

  def handleError(error: AppError): String = {
    error match {
      case e: CalculationError =>
        s"Calculation error: ${e.message}"
      case e: UnexpectedError =>
        s"Unexpected error: ${e.message}"
    }
  }

  "should handle error" in {
    App.divide(2, 0).fold(handleError, identity[Double]) shouldEqual "Calculation error: Cannot divide by 0"
  }

  "should handle success" in {
    App.divide(4, 2).fold(handleError, identity[Double]) shouldEqual 2.0
  }

  "should handle series of operations" in {
    val result = List(2, 3).foldLeft(24.0.asResult)(
      (acc, number) =>
        acc.flatMap(App.divide(_, number))
    )
    result shouldEqual 4.0.asResult
  }

  "should handle series of operations with errors" in {
    val result = List(2, 0, 3).foldLeft(24.0.asResult)(
      (acc, number) =>
        acc.flatMap(App.divide(_, number))
    )
    result shouldEqual Left(CalculationError("Cannot divide by 0"))
  }
}
