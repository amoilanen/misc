package learning.case_study_map_reduce

import scala.language.postfixOps

import cats.Monoid

import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration._

object MapReduce {

  val TimeoutSeconds = 10

  def reduce[B](input: Vector[B])(implicit m: Monoid[B]): B =
    input.reduce((partialResult, mappedItem) =>
      m.combine(partialResult, mappedItem)
    )

  def foldMap[A, B: Monoid](input: Vector[A])(f: A => B): B =
    reduce(input.map(f))

  def parallelFoldMap[A, B: Monoid](input: Vector[A])(f: A => B)(implicit ec: ExecutionContext): B = {
    val availableCPUs = Runtime.getRuntime.availableProcessors()

    val batches = input.grouped(availableCPUs)
    val submittedBatches: Iterator[Future[B]] = batches.map(batch => Future {
      foldMap(batch)(f)
    })
    val completedBatches: Iterator[B] = Await.result(Future.sequence(submittedBatches), TimeoutSeconds seconds)

    reduce(completedBatches.toVector)
  }
}
