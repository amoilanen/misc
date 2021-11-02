package io.github.antivanov.zio.demo.matrix

import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration._

object ParallelMultiplier extends MatrixMultiplier {
  private val MaxTimeout = 1.minute
  private val DefaultThreadNumber = 50
  private implicit val ec: ExecutionContext = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(DefaultThreadNumber))

  case class ElementComputationResult(xRow: Int, yColumn: Int, element: Int)
  case class ElementComputationTask(xValues: Seq[Seq[Int]], yValues: Seq[Seq[Int]], xRow: Int, yColumn: Int) {
    def compute: Future[ElementComputationResult] =
      Future {
        (0 until yValues.size).map(k =>
          xValues(xRow)(k) * yValues(k)(yColumn)
        ).reduce(_ + _)
      }.map(ElementComputationResult(xRow, yColumn, _))
  }

  private def computeProductElements(x: Matrix, y: Matrix): Future[Seq[ElementComputationResult]] = {
    val xValues: Seq[Seq[Int]] = x.valuesSeq
    val yValues: Seq[Seq[Int]] = y.valuesSeq
    Future.sequence(
      (0 until x.height).flatMap(i =>
        (0 until y.width).map(j =>
          ElementComputationTask(xValues, yValues, i, j).compute
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
