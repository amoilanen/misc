package io.github.antivanov.zio.demo.matrix

object SynchronousMultiplier extends MatrixMultiplier {

  def multiply(x: Matrix, y: Matrix): Either[IllegalArgumentException, Matrix] = {
    if (x.width == y.height) {
      val product = Array.fill(x.height)(Array.fill(y.width)(0))
      (0 until x.height).map(i =>
        (0 until y.width).map(j =>
          product(i)(j) = (0 until x.width).map(k =>
            x.values(i)(k) * y.values(k)(j)
          ).reduce(_ + _)
        )
      )
      Right(Matrix(product))
    } else
      Left(new IllegalArgumentException(s"Matrix dimensions do not match width ${x.width} != height ${y.height}"))
  }
}
