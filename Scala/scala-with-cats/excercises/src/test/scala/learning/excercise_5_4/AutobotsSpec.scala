package learning.excercise_5_4

import org.scalatest.{WordSpec, _}
import scala.concurrent.Await
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

class AutobotsSpec extends WordSpec with Matchers {

  val powerLevels = Map(
    "Jazz" -> 6,
    "Bumblebee" -> 8,
    "Hot Rod" -> 10
  )

  val autobots = Autobots(powerLevels)

  "getPowerLevel" should {

    "should work with one known robot" in {
      val result = Await.result(autobots.getPowerLevel("Jazz").value, 1.second)

      result shouldEqual Right(6)
    }

    "should work with one unknown robot" in {
      val result = Await.result(autobots.getPowerLevel("Ironhide").value, 1.second)

      result shouldEqual Left("Comms error: Ironhide unreachable")
    }

    "should work with several known robots" in {
      val result = Await.result(autobots.getPowerLevel(Set("Bumblebee", "Hot Rod", "Jazz")).value, 1.second)

      result shouldEqual Right(24)
    }

    "should work with several robots one of which is not known" in {
      val result = Await.result(autobots.getPowerLevel(Set("Bumblebee", "Hot Rod", "Ironhide")).value, 1.second)

      result shouldEqual Left("Comms error: Ironhide unreachable")
    }
  }

  "canSpecialMove" should {

    "return true for autobots that can perform a special move" in {
      val result = Await.result(autobots.canSpecialMove("Hot Rod", "Bumblebee").value, 1.second)

      result shouldEqual Right(true)
    }

    "return false for autobots that cannot perform a special move" in {
      val result = Await.result(autobots.canSpecialMove("Jazz", "Bumblebee").value, 1.second)

      result shouldEqual Right(false)
    }

    "return error if one autobot cannot be reached" in {
      val result = Await.result(autobots.canSpecialMove("Jazz", "Ironhide").value, 1.second)

      result shouldEqual Left("Comms error: Ironhide unreachable")
    }
  }

  "tacticalReport" should {

    "return report for autobots that can perform a special move" in {
      val result = autobots.tacticalReport("Bumblebee", "Hot Rod")

      result shouldEqual "Bumblebee and Hot Rod are ready to roll out!"
    }

    "return report for autobots that cannot perform a special move" in {
      val result = autobots.tacticalReport("Jazz", "Bumblebee")

      result shouldEqual "Jazz and Bumblebee need a recharge."
    }

    "return report if one autobot cannot be reached" in {
      val result = autobots.tacticalReport("Jazz", "Ironhide")

      result shouldEqual "Comms error: Ironhide unreachable"
    }
  }
}
