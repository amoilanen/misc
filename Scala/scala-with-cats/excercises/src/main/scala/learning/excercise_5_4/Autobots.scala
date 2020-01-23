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

  def getPowerLevel(autobot: String): Response[Int] =
    EitherT(Future {
      robots.get(autobot).fold(
        s"Comms error: $autobot unreachable".asLeft[Int]
      )(_.asRight)
    })

  def getPowerLevel(autobots: Set[String]): Response[Int] =
      autobots
        .map(getPowerLevel(_))
        .foldLeft(0.pure[Response])({ (robotPower, totalPower) =>
          for {
            totalPowerValue <- totalPower
            robotPowerValue <- robotPower
          } yield (totalPowerValue + robotPowerValue)
        })

  def canSpecialMove(allies: String*): Response[Boolean] =
    getPowerLevel(allies.toSet).map(_ > MinimalSpecialPower)

  def tacticalReport(allies: String*): String = {
    val messageIntro: String = allies.mkString(" and ")
    val report: Future[String] = canSpecialMove(allies: _*).map(
      if (_) {
        s"${messageIntro} are ready to roll out!"
      } else {
        s"${messageIntro} need a recharge."
      }
    ).fold(identity[String], identity[String])

    Await.result(report, 1.second)
  }
}
