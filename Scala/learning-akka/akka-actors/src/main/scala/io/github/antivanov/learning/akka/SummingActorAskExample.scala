package io.github.antivanov.learning.akka

import scala.concurrent.duration._
import akka.actor.typed.{ActorRef, ActorSystem, Behavior}
import akka.actor.typed.scaladsl.Behaviors
import akka.util.Timeout

import scala.util.{Failure, Success}

object SummingActorAskExample extends App {

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

    def apply(values: Seq[Int]): Behavior[Sum] =  Behaviors.setup { context =>
      val summingActor = context.spawn(SummingActor(), "summing-actor")

      implicit val timeout: Timeout = 2.seconds
      values.foreach({ value =>
        context.ask(summingActor, (ref: ActorRef[Sum]) => AddValue(ref, value)) {
          case Success(Sum(value)) =>
            context.log.debug(s"Received sum from SummingActor ${value}")
            Sum(value)
          case Failure(_) =>
            context.log.debug(s"Failed to compute the sum")
            Sum(0)
        }
      })
      Behaviors.same
      /*
      Behaviors.receiveMessage[Sum] {
        case Sum(value) =>
          context.log.debug(s"Sum = ${value}")
          Behaviors.same
      }
      */
    }
  }

  val values = Seq(1, 2, 3, 4, 5)
  ActorSystem(MainActor(values), "main-actor")
}
