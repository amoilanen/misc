package learning.excercise_5_4

import cats.data.EitherT

import scala.concurrent.{ExecutionContext, Future}
import cats.syntax.either._
import cats.syntax.applicative._
import cats.instances.future._
import scala.concurrent.Await
import scala.concurrent.duration._

case class Autobots(robots: Map[String, Int])(implicit ec: ExecutionContext) {

  val MinimalSpecialPower = 15

  type Response[A] = EitherT[Future, String, A]

  def getPowerLevel(autobot: String): Response[Int] = {
    val robotPowerLevel = robots.get(autobot) match {
      case Some(value) => value.asRight[String]
      case None => s"Comms error: $autobot unreachable".asLeft[Int]
    }
    EitherT(Future { robotPowerLevel })
  }

  def getPowerLevel(autobots: Set[String]): Response[Int] = {
    val powerLevels = autobots.map(getPowerLevel(_))
    powerLevels.foldLeft(0.pure[Response])((robotPower, totalPower) =>
      for {
        totalPowerValue <- totalPower
        robotPowerValue <- robotPower
      } yield (totalPowerValue + robotPowerValue)
    )
  }

  def canSpecialMove(ally1: String, ally2: String): Response[Boolean] =
    for {
      power1 <- getPowerLevel(ally1)
      power2 <- getPowerLevel(ally2)
    } yield (power1 + power2 > MinimalSpecialPower)

  def tacticalReport(ally1: String, ally2: String): String = {
    val canMove: Either[String, Boolean] = Await.result(canSpecialMove(ally1, ally2).value, 1.second)

    canMove.fold(
      error => error,
      canMove =>
        if (canMove) s"$ally1 and $ally2 are ready to roll out!"
        else s"$ally1 and $ally2 need a recharge."
    )
  }
}
