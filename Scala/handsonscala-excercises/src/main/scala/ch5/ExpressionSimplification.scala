package ch5

import scala.annotation.tailrec

object ExpressionSimplification extends App {

  trait Expr {
    def negate(): Expr =
      Operation(Number(-1), this, '*')
  }
  case class Operation(left: Expr, right: Expr, op: Char) extends Expr {
    override def toString(): String = {
      s"($left $op $right)"
    }
  }
  case class Number(value: Int) extends Expr {
    override def negate(): Expr =
      Number(-value)

    override def toString(): String =
      value.toString
  }
  case class Variable(name: String) extends Expr {
    override def toString(): String =
      name
  }

  //E -> (E)
  //E -> E + E
  //E -> E * E
  //E -> E - E
  //E -> V
  //E -> N
  object Parser {
    def parse(input: String, pointer: Int = 0): Expr =
      expression(
        input.replaceAll("\\s+", "").toCharArray,
        pointer = 0)._1

    def expression(input: Array[Char], pointer: Int): (Expr, Int) =
      if (input(pointer) == '(') {
        val (leftOperand, pointerAfterLeft) = expression(input, pointer + 1)
        val operator = input(pointerAfterLeft)
        val (rightOperand, pointerAfterRight) = expression(input, pointerAfterLeft + 1)
        val parsedExpr = Operation(leftOperand, rightOperand, operator)
        (parsedExpr, pointerAfterRight + 1) // + 1 due to the closing ')'
      } else if (isVariableName(input(pointer))) {
        variable(input, pointer)
      } else {
        number(input, pointer)
      }

    def variable(input: Array[Char], pointer: Int): (Expr, Int) =
      (Variable(input(pointer).toString), pointer + 1)

    def number(input: Array[Char], pointer: Int): (Expr, Int) = {
      val numberChars = input.drop(pointer).takeWhile(d => d >= '0' && d <= '9')
      (Number(numberChars.mkString("").toInt), pointer + numberChars.length)
    }

    def isVariableName(v: Char): Boolean =
      v <= 'z' && v >= 'a'
  }


  def simplify(expression: String): String = {
    val parsedExpr = Parser.parse(expression)
    simplify(parsedExpr).toString
  }

  def simplify(expr: Expr): Expr = {
    val simplified = tryToSimplify(expr)
    if (simplified.equals(expr)) {
      simplified
    } else {
      simplify(simplified)
    }
  }

  private def tryToSimplify(expression: Expr): Expr = expression match {
    case Operation(Number(1), right, '*') =>
      simplify(right)
    case Operation(left, Number(1), '*') =>
      simplify(left)
    case Operation(Number(0), _, '*') =>
      Number(0)
    case Operation(_, Number(0), '*') =>
      Number(0)
    case Operation(Number(0), right, '+') =>
      simplify(right)
    case Operation(left, Number(0), '+') =>
      simplify(left)
    case Operation(left, Number(0), '-') =>
      simplify(left)
    case Operation(Number(0), right, '-') =>
      simplify(right.negate())
    case Operation(Number(x), Number(y), '-') =>
      Number(x - y)
    case Operation(Number(x), Number(y), '+') =>
      Number(x + y)
    case Operation(Number(x), Number(y), '*') =>
      Number(x * y)
    case Operation(left, right, op) =>
      Operation(simplify(left), simplify(right), op)
    case expr => expr
  }
}