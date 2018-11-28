package learning.case_study_map_reduce

import scala.language.postfixOps

import cats.Foldable
import cats.Monoid
import cats.instances.vector._
import cats.instances.future._
import cats.syntax.traverse._
import cats.syntax.monoid._

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

  def parallelCatsFoldMap[A, B: Monoid](input: Vector[A])(f: A => B)(implicit ec: ExecutionContext): B = {
    val availableCPUs = Runtime.getRuntime.availableProcessors()

    val batches: Vector[Vector[A]] = input.grouped(availableCPUs).toVector
    val submittedBatches: Future[Vector[B]] = batches.traverse { batch: Vector[A] =>
      Future {
        Foldable[Vector].foldLeft(batch, Monoid[B].empty) { case (acc, a) =>
          acc |+| f(a)
        }
      }
    }

    val completedBatches: Vector[B] = Await.result(submittedBatches, TimeoutSeconds seconds)

    Foldable[Vector].foldLeft(completedBatches.toVector, Monoid[B].empty) { case (acc, b) =>
      acc |+| b
    }
  }
}
