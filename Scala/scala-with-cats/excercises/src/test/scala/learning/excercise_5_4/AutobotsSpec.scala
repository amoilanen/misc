package learning.excercise_5_4

import org.scalatest.{WordSpec, _}
import scala.concurrent.Await
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

class AutobotsSpec extends WordSpec with Matchers {

  "getPowerLevel" should {

    val powerLevels = Map(
      "Jazz" -> 6,
      "Bumblebee" -> 8,
      "Hot Rod" -> 10
    )

    val autobots = Autobots(powerLevels)

    "should work with one known robot" in {
      val result = Await.result(autobots.getPowerLevel("Jazz").value, 1.second)

      result shouldEqual Right(6)
    }

    "should work with one unknown robot" in {
      val result = Await.result(autobots.getPowerLevel("Jazz 2").value, 1.second)

      result shouldEqual Left("Unknown robot Jazz 2")
    }

    "should work with several known robots" in {
      val result = Await.result(autobots.getPowerLevel(Set("Bumblebee", "Hot Rod", "Jazz")).value, 1.second)

      result shouldEqual Right(24)
    }

    "should work with several robots one of which is not known" in {
      val result = Await.result(autobots.getPowerLevel(Set("Bumblebee", "Hot Rod", "Jazz 2")).value, 1.second)

      result shouldEqual Left("Unknown robot Jazz 2")
    }
  }
}
