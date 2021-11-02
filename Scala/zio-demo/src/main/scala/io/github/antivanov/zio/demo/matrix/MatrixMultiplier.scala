package io.github.antivanov.zio.demo.matrix

trait MatrixMultiplier {

  def multiply(x: Matrix, y: Matrix): Either[IllegalArgumentException, Matrix]
}
