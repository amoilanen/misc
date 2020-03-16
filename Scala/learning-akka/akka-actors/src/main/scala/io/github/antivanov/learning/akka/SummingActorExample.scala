package io.github.antivanov.learning.akka

import akka.actor.typed.ActorRef
import akka.actor.typed.ActorSystem
import akka.actor.typed.Behavior
import akka.actor.typed.scaladsl.Behaviors

object SummingActorExample extends App {
  object Events {
    trait SummingEvent
    case class AddValue(ref: ActorRef[Sum], value: Int) extends SummingEvent
    case class Sum(value: Int) extends SummingEvent
  }

  import Events._

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

    def init(values: Seq[Int], replyTo: Option[ActorRef[Sum]] = None): Behavior[Sum] =  Behaviors.setup { context =>
      val summingActor = context.spawn(SummingActor(), "summing-actor")

      values.foreach(summingActor ! AddValue(context.self, _))
      computeSum(values, 0, replyTo)
    }

    def computeSum(values: Seq[Int], valuesProcessed: Int, replyTo: Option[ActorRef[Sum]]): Behavior[Sum] = Behaviors.setup { context =>
      Behaviors.receiveMessage[Sum] {
        case Sum(value) =>
          val updatedValuesProcessed = valuesProcessed + 1
          if (updatedValuesProcessed == values.size) {
            context.log.debug(s"Final sum = ${value}")
            replyTo.foreach(_ ! Sum(value))
            Behaviors.same
          } else {
            context.log.debug(s"valuesProcessed = ${valuesProcessed}, running sum = ${value}")
            computeSum(values, updatedValuesProcessed, replyTo)
          }
      }
    }
  }

  val values = Seq(1, 2, 3, 4, 5)
  ActorSystem(MainActor.init(values), "main-actor")
}
