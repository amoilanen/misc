package io.github.antivanov.zio.demo.matrix

import zio.{UIO, ZIO}

object ZIOParallelMultiplier extends MatrixMultiplier {

  case class ElementComputationResult(xRow: Int, yColumn: Int, element: Int)
  case class ElementComputationTask(x: Matrix, y: Matrix, xRow: Int, yColumn: Int) {
    def compute: UIO[ElementComputationResult] =
      ZIO.succeed {
        (0 until y.height).map(k =>
          x.values(xRow)(k) * y.values(k)(yColumn)
        ).reduce(_ + _)
      }.map(ElementComputationResult(xRow, yColumn, _))
  }

  private def computeProductElements(x: Matrix, y: Matrix): UIO[Seq[ElementComputationResult]] =
    for {
      indices <- ZIO.succeed((0 until x.height).flatMap(i =>
        (0 until y.width).map(j =>
          (i, j)
        )
      ))
      computationResults <- ZIO.collectPar(indices)({ case (i, j) =>
        ElementComputationTask(x, y, i, j).compute
      })
    } yield computationResults

  private def combineComputedElements(height: Int, width: Int, computedElements: Seq[ElementComputationResult]): UIO[Matrix] =
    for {
      product <- ZIO.succeed(Array.fill(height)(Array.fill(width)(0)))
      _ <- ZIO.foreachPar(computedElements)({ case ElementComputationResult(xRow, yColumn, element) => ZIO.succeed(
          product(xRow)(yColumn) = element
        )
      })
    } yield Matrix(product)

  override def multiply(x: Matrix, y: Matrix): Either[IllegalArgumentException, Matrix] = {
    if (x.width == y.height) {
      val product = for {
        computedElements <- computeProductElements(x, y)
        product <- combineComputedElements(x.height, y.width, computedElements)
      } yield product
      val matrix = zio.Runtime.default.unsafeRun(product)
      Right(matrix)
    } else
      Left(new IllegalArgumentException(s"Matrix dimensions do not match width ${x.width} != height ${y.height}"))
  }
}
