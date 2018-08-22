package learning.excercise_4_7_3

import scala.concurrent._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import org.scalatest.{Matchers, WordSpec}

import FactorialWriter._

class FactorialWriterSpec extends WordSpec with Matchers {

  "factorial" should {

    "compute correctly" in {
      factorial(5).value shouldEqual 120
    }

    "produce retracable logs" in {
      val result: Seq[Result[Int]] = Await.result(Future.sequence(Vector(
        Future(factorial(3)),
        Future(factorial(3))
      )), 5.seconds)

      result.map(_.value) shouldEqual Seq(6, 6)
      result.map(_.written) shouldEqual Seq(
        Vector(
          "fact 0 1",
          "fact 1 1",
          "fact 2 2",
          "fact 3 6"
        ),
        Vector(
          "fact 0 1",
          "fact 1 1",
          "fact 2 2",
          "fact 3 6"
        )
      )
    }
  }
}
