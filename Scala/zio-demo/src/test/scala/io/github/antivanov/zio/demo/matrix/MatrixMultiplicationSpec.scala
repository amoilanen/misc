package io.github.antivanov.zio.demo.matrix

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

import MatrixMultiplication._

class MatrixMultiplicationSpec extends AnyFreeSpec with Matchers {

  "matrix multiplication" - {

    "should correctly multiply two square matrices with matching dimensions" in {
      val a = Matrix(Array(
        Array(1, 2),
        Array(3, 4)
      ))
      val b = Matrix(Array(
        Array(5, 6),
        Array(7, 8)
      ))
      multiply(a, b) shouldEqual Right(Matrix(Array(
        Array(19, 22),
        Array(43, 50)
      )))
    }

    "should multiply two vectors" in {

    }

    "should correctly multiply rectangular matrices with matching dimensions" in {

    }

    "should return error if the dimensions of the matrices do not match" in {

    }
  }
}
