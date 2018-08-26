package learning.excercise_4_9_3

import cats.data.State

import scala.util.Try

object Calculator {

  type CalcState[A] = State[List[Int], A]

  final case class EvaluationException(message: String, cause: Throwable = null) extends Exception(message, cause)

  def evaluate(operator: String, leftOperand: Int, rightOperand: Int) = operator match {
    case "+" => leftOperand + rightOperand
    case "-" => leftOperand - rightOperand
    case "*" => leftOperand * rightOperand
  }

  val SupportedOperators: Seq[String] = Seq("+", "-", "*")

  def isOperator(operator: String): Boolean =
    SupportedOperators.contains(operator)

  def evalOne(sym: String): CalcState[Int] = State[List[Int], Int] { currentStack =>
    if (isOperator(sym)) {
      currentStack match {
        case leftOperand::rightOperand::restOfStack => {
          val intermediateResult = evaluate(sym, leftOperand, rightOperand)
          (intermediateResult +: restOfStack, intermediateResult)
        }
        case _ =>
          throw new EvaluationException(s"Encountered operator ${sym} but not enough operands, stack ${currentStack}")
      }
    } else {
      try {
        val currentNumber = sym.toInt
        (currentNumber +: currentStack, currentNumber)
      } catch {
        case error: NumberFormatException =>
          throw new EvaluationException(s"$sym is not a number")
      }
    }
  }

  def evalAll(input: List[String]): CalcState[Int] = State[List[Int], Int] { currentStack =>
    val initialState = State[List[Int], Int](_ => (currentStack, 0))

    val finalState: State[List[Int], Int] = input.foldLeft(initialState) {
      case (currentState, nextSymbol: String) =>
        currentState.flatMap { _ =>
          evalOne(nextSymbol)
        }
    }
    finalState.run(currentStack).value
  }

  def evalInput(input: String): Either[Throwable, Int] = Try {
    val inputSymbols = input.split(" ").toList
    evalAll(inputSymbols).runA(List()).value
  }.toEither
}
