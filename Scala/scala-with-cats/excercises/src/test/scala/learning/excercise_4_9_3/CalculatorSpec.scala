package learning.excercise_4_9_3

import org.scalatest.{Matchers, WordSpec}

import Calculator._

class CalculatorSpec extends WordSpec with Matchers {

  "evalOne" should {

    "return CalcState for valid integer" in {
      evalOne("1").run(List()).value.shouldBe((List(1), 1))
    }

    "run with an empty stack and integer" in {
      evalOne("42").runA(Nil).value shouldBe 42
    }

    "throw exception if not an integer" in {
      an [EvaluationException] should be thrownBy evalOne("a").run(List()).value.shouldBe((List(), 1))
    }

    "run with a non-empty stack and operator" in {
      evalOne("+").run(List(1, 2)).value.shouldBe((List(3), 3))
    }

    "run subsequent evaluations (book example)" in {
      val program = for {
        _ <- evalOne("1")
        _ <- evalOne("2")
        ans <- evalOne("+")
      } yield ans
      program.runA(Nil).value shouldBe 3
    }
  }

  "evalAll" should {

    "evaluate list of inputs" in {
      val program = evalAll(List("1", "2", "+", "3", "*"))
      program.runA(Nil).value shouldBe 9
    }

     "evalOne and evalAll used together (book example)" in {
       val program = for {
         _ <- evalAll(List("1", "2", "+"))
         _ <- evalAll(List("3", "4", "+"))
         ans <- evalOne("*")
       } yield ans

       program.runA(Nil).value shouldBe 21
     }
  }

  "evalInput" should {

    "evaluate input (book example)" in {
      evalInput("1 2 + 3 *") shouldEqual Right(9)
    }
  }

  "error situations" should {

    "return Left when unknown operator is used" in {
      evalInput("1 # 2") shouldBe Left(new EvaluationException("# is not a number"))
    }

    "return Left when not enough operands" in {
      evalInput("1 +") shouldBe Left(new EvaluationException("Encountered operator + but not enough operands, stack List(1)"))
    }
  }
}