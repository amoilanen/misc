package io.github.antivanov.zio.demo.matrix

import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration._

object ParallelMultiplier extends MatrixMultiplier {
  private val MaxTimeout = 1.minute
  private val DefaultThreadNumber = 64
  private implicit val ec: ExecutionContext = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(DefaultThreadNumber))

  case class ElementComputationResult(xRow: Int, yColumn: Int, element: Int)
  case class ElementComputationTask(x: Matrix, y: Matrix, xRow: Int, yColumn: Int) {
    def compute: Future[ElementComputationResult] =
      Future {
        (0 until y.height).map(k =>
          x.values(xRow)(k) * y.values(k)(yColumn)
        ).reduce(_ + _)
      }.map(ElementComputationResult(xRow, yColumn, _))
  }

  private def computeProductElements(x: Matrix, y: Matrix): Future[Seq[ElementComputationResult]] = {
    Future.sequence(
      (0 until x.height).flatMap(i =>
        (0 until y.width).map(j =>
          ElementComputationTask(x, y, i, j).compute
        )
      )
    )
  }

  override def multiply(x: Matrix, y: Matrix): Either[IllegalArgumentException, Matrix] = {
    if (x.width == y.height) {
      val product = Array.fill(x.height)(Array.fill(y.width)(0))
      val computedElements = Await.result(computeProductElements(x, y), MaxTimeout)
      computedElements.foreach({
        case ElementComputationResult(xRow, yColumn, element) =>
          product(xRow)(yColumn) = element
      })
      Right(Matrix(product))
    } else
      Left(new IllegalArgumentException(s"Matrix dimensions do not match width ${x.width} != height ${y.height}"))
  }
}
