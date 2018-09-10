package learning.excercise_5_4

import cats.data.EitherT

import scala.concurrent.{ExecutionContext, Future}
import cats.syntax.either._
import cats.syntax.applicative._
import cats.instances.future._

case class Autobots(robots: Map[String, Int])(implicit ec: ExecutionContext) {

  type Response[A] = EitherT[Future, String, A]

  def getPowerLevel(autobot: String): Response[Int] = {
    val robotPowerLevel = robots.get(autobot) match {
      case Some(value) => value.asRight[String]
      case None => s"Unknown robot $autobot".asLeft[Int]
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
}
