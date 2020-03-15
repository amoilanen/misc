package io.github.antivanov.learning.akka

import scala.concurrent.duration._
import akka.actor.typed.{ActorRef, ActorSystem, Behavior}
import akka.actor.typed.scaladsl.Behaviors
import akka.util.Timeout

import scala.util.{Failure, Success}

object SummingActorAskExample extends App {

  object SummingActor {

    trait Event
    case class AddValue(ref: ActorRef[Sum], value: Int) extends Event
    case class Sum(value: Int) extends Event

    def apply(sum: Int = 0): Behavior[SummingActor.Event] = Behaviors.receive { (context, message) => message match {
      case AddValue(ref, value) =>
        context.log.debug(s"Adding ${value}")
        val newSum = sum + value
        ref ! Sum(newSum)
        SummingActor(newSum)
      }
    }
  }

  object MainActor {

    implicit val askTimeout: Timeout = 2.seconds

    sealed trait Event
    case class SummingFailed(reason: Throwable) extends Event
    case class OngoingSumming(sum: Int) extends Event

    def init(values: Seq[Int]): Behavior[MainActor.Event] =  Behaviors.setup { context =>
      val summingActor = context.spawn(SummingActor(), "summing-actor")

      values.foreach({ value =>
        context.ask(summingActor, (ref: ActorRef[SummingActor.Sum]) => SummingActor.AddValue(ref, value)) {
          case Success(SummingActor.Sum(sum)) =>
            context.log.debug(s"Received sum from SummingActor ${sum}")
            OngoingSumming(sum)
          case Failure(e) =>
            context.log.debug(s"Failed to compute the sum")
            SummingFailed(e)
        }
      })

      computeSum(summingActor, values, 0)
    }

    def computeSum(summingActor: ActorRef[SummingActor.Event], values: Seq[Int], valuesProcessed: Int): Behavior[MainActor.Event] = Behaviors.setup { context =>
      Behaviors.receiveMessage[MainActor.Event] {
        case OngoingSumming(value) =>
          val updatedValuesProcessed = valuesProcessed + 1
          if (values.size == updatedValuesProcessed) {
            context.log.debug(s"Final sum = ${value}")
            Behaviors.same
          } else {
            context.log.debug(s"valuesProcessed = ${valuesProcessed}, running sum = ${value}")
            computeSum(summingActor, values, updatedValuesProcessed)
          }
        case SummingFailed(reason) =>
          context.log.error(s"MainActor failed to compute the sum", reason)
          Behaviors.same
      }
    }
  }

  val values = Seq(1, 2, 3, 4, 5)
  ActorSystem(MainActor.init(values), "main-actor")
}
