package io.github.antivanov.learning.akka


import akka.actor.typed.ActorRef
import akka.actor.typed.ActorSystem
import akka.actor.typed.Behavior
import akka.actor.typed.scaladsl.Behaviors

import Events._

object Events {
  sealed trait SummingEvent
  case class AddValue(ref: ActorRef[Sum], value: Int) extends SummingEvent
  case class Sum(value: Int) extends SummingEvent
}

object SummingActor {

  def apply(sum: Int = 0): Behavior[SummingEvent] = Behaviors.receive { (context, message) => message match {
      case AddValue(ref, value) =>
        context.log.debug(s"Adding ${value}")
        val newSum = sum + value
        ref ! Sum(newSum)
        SummingActor(newSum)
    }
  }
}

object MainActor {

  def apply(values: Seq[Int]): Behavior[Sum] =  Behaviors.setup { context =>
    val summingActor = context.spawn(SummingActor(), "summing-actor")

    values.foreach(summingActor ! AddValue(context.self, _))

    Behaviors.receiveMessage[Sum] {
      case Sum(value) =>
        context.log.debug(s"Sum = ${value}")
        Behaviors.same
    }
  }
}

object SummingActorExample extends App {
  val values = Seq(1, 2, 3, 4, 5)
  ActorSystem(MainActor(values), "main-actor")
}
