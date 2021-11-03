package io.github.antivanov.zio.demo.matrix

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

import scala.util.Random

class MatrixMultiplicationSpec extends AnyFreeSpec with Matchers {

  val multipliers = List(SynchronousMultiplier, ParallelMultiplier, ZIOParallelMultiplier)

  multipliers.foreach(multiplier => {
    val multiplierName = multiplier.getClass.getSimpleName

    s"matrix multiplication using $multiplierName" - {

      "should correctly multiply two square matrices with matching dimensions" in {
        val a = Matrix(Array(
          Array(1, 2),
          Array(3, 4)
        ))
        val b = Matrix(Array(
          Array(5, 6),
          Array(7, 8)
        ))
        multiplier.multiply(a, b) shouldEqual Right(Matrix(Array(
          Array(19, 22),
          Array(43, 50)
        )))
      }

      "should multiply two vectors" in {
        val a = Matrix(Array(
          Array(1, 2)
        ))
        val b = Matrix(Array(
          Array(3),
          Array(4)
        ))

        multiplier.multiply(a, b) shouldEqual Right(Matrix(Array(
          Array(11)
        )))
      }

      "should correctly multiply rectangular matrices with matching dimensions" in {
        val a = Matrix(Array(
          Array(1, 1, 1),
          Array(1, 1, 1)
        ))
        val b = Matrix(Array(
          Array(1, 1),
          Array(1, 1),
          Array(1, 1)
        ))
        multiplier.multiply(a, b) shouldEqual Right(Matrix(Array(
          Array(3, 3),
          Array(3, 3)
        )))
      }

      "should return error if the dimensions of the matrices do not match" in {
        val b = Matrix(Array(
          Array(1, 2)
        ))
        val a = Matrix(Array(
          Array(3, 4)
        ))

        multiplier.multiply(a, b).swap.map(_.getMessage) shouldEqual Right("Matrix dimensions do not match width 2 != height 1")
      }

      val FirstMatrixHeight = 30
      val FirstMatrixWidth = 300000
      val MaxRandomValue = 1000
      val multiplyTimes = 2
      def randomMatrix(width: Int, height: Int, maxRandomValue: Int): Matrix = {
        val values = Array.fill(width, height)(Random.nextInt(maxRandomValue + 1))
        Matrix(values)
      }
      val x = randomMatrix(FirstMatrixHeight, FirstMatrixWidth, MaxRandomValue)
      val y = randomMatrix(FirstMatrixWidth, FirstMatrixHeight, MaxRandomValue)

      "benchmark multiplication" - {
        "multiply two large random matrices" in {
          (0 to multiplyTimes).foreach(_ =>
            multiplier.multiply(x, y).isRight shouldBe true
          )
        }
      }
    }
  })
}
