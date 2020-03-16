package io.github.antivanov.learning.akka

import akka.actor.ActorSystem
import akka.testkit.{ImplicitSender, TestKit}
import org.scalatest.BeforeAndAfterAll
import org.scalatest.freespec.AnyFreeSpecLike

import SummingClassicActorExample._
import SummingClassicActorExample.Events._

class SummingClassicActorExampleSpec extends TestKit(ActorSystem("testsystem")) with ImplicitSender with AnyFreeSpecLike with BeforeAndAfterAll {

  override protected def afterAll(): Unit = {
    system.terminate()
  }

  "SummingActor" - {

    "should reply with the current sum" in {
      val summingActor = system.actorOf(SummingActor.props, "summing-actor")

      summingActor ! AddValue(1)
      expectMsg(Sum(1))
      summingActor ! AddValue(2)
      expectMsg(Sum(3))
      summingActor ! AddValue(3)
      expectMsg(Sum(6))
    }
  }

  "MainActor" - {

    "should reply with the final sum" in {
      val values = Seq(1, 2, 3)
      system.actorOf(MainActor.props(values, Some(testActor)), "main-actor")

      expectMsg(Sum(values.sum))
    }
  }
}
