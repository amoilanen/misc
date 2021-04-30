package ch5

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

import ch5.ExpressionSimplification._

class ExpressionSimplificationSpec extends AnyFreeSpec with Matchers {

  val simplificationExamples = List(
    ("(1 + 1)", "2"),
    ("((1 + 1) * x)", "(2 * x)"),
    ("((2 - 1) * x)", "x"),
    ("(((1 + 1) * y) + ((1 - 1) * x))", "(2 * y)")
  )

  simplificationExamples.foreach({ case (original, simplified) =>

    s"'$original' should be simplified to '$simplified'" in {
      simplify(original) shouldEqual(simplified)
    }
  })
}