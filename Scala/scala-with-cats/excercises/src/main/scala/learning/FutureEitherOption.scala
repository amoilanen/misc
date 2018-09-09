package learning

import scala.concurrent._
import scala.concurrent.duration._

import cats.data.{EitherT, OptionT}
import cats.instances.future._ // for Monad
import scala.concurrent.Await
import scala.concurrent.ExecutionContext.Implicits.global
import cats.syntax.applicative._
import scala.language.postfixOps

object FutureEitherOption extends App {

  type FutureEither[A] = EitherT[Future, String, A]
  type FutureEitherOption[A] = OptionT[FutureEither, A]

  val futureEitherOr: FutureEitherOption[Int] =
    for {
      a <- 10.pure[FutureEitherOption]
      b <- 32.pure[FutureEitherOption]
    } yield a + b

  val result = Await.result(futureEitherOr.value.value, 1 second)
  println(result)
}
