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
    List(8, 2, 2, 2).map(_.asResult).fold(1.0.asResult)(
      (acc: Result[Double], number: Int) =>
        acc.flatMap[AppError, Double](accValue => App.divide(accValue, number))
    )
  }
}
