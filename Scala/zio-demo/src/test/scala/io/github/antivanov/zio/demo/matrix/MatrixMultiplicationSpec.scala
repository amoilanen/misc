package io.github.antivanov.zio.demo.matrix

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

import scala.util.Random

class MatrixMultiplicationSpec extends AnyFreeSpec with Matchers {

  val multipliers = List(SynchronousMultiplier, ParallelMultiplier)

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

      "benchmark multiplication" - {

        val DefaultSize = 700
        val DefaultMaxRandomValue = 100
        def randomMatrix(size: Int = DefaultSize, maxRandomValue: Int = DefaultMaxRandomValue): Matrix = {
          val values = Array.fill(size, size)(Random.nextInt(maxRandomValue + 1))
          Matrix(values)
        }
        val x = randomMatrix()
        val y = randomMatrix()

        "multiply two large random matrices" in {
          multiplier.multiply(x, y).isRight shouldBe true
        }
      }
    }
  })
}
