package io.github.antivanov.learning.akka

import akka.actor.testkit.typed.scaladsl.ActorTestKit
import org.scalatest.BeforeAndAfterAll
import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpec

import io.github.antivanov.learning.akka.SummingActorExample._

class SummingActorExampleSpec extends AnyFreeSpec with BeforeAndAfterAll with Matchers {

  val testKit = ActorTestKit()

  override def afterAll(): Unit = testKit.shutdownTestKit()

  "SummingActor" - {
    import SummingActorExample.Events._

    "should reply with the current sum" in {
      val summingActor = testKit.spawn(SummingActor(), "summing-actor")
      val probe = testKit.createTestProbe[Sum]()

      summingActor ! AddValue(probe.ref, 1)
      probe.expectMessage(Sum(1))
      summingActor ! AddValue(probe.ref, 2)
      probe.expectMessage(Sum(3))
      summingActor ! AddValue(probe.ref, 3)
      probe.expectMessage(Sum(6))
    }
  }

  "MainActor" - {
    import SummingActorExample.Events._

    "should reply with the final sum" in {
      val values = Seq(1, 2, 3)
      val probe = testKit.createTestProbe[Sum]()
      testKit.spawn(MainActor.init(values, Some(probe.ref)), "main-actor")

      probe.expectMessage(Sum(values.sum))
    }
  }
}
