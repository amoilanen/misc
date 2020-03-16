package io.github.antivanov.learning.akka

import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, Props}

object SummingClassicActorExample extends App {

  object Events {
    case class AddValue(value: Int)
    case class Sum(value: Int)
  }
  import Events._

  class SummingActor extends Actor with ActorLogging {

    var sum = 0

    def receive = {
      case AddValue(value) =>
        log.info(s"Adding ${value}")
        sum = sum + value
        sender() ! Sum(sum)
    }
  }

  object SummingActor {

    def props =
      Props(new SummingActor())
  }

  class MainActor(values: Seq[Int], replyTo: Option[ActorRef]) extends Actor with ActorLogging {

    var valuesSummed = 0
    var sum = 0

    val summingActor: ActorRef =
      context.actorOf(SummingActor.props, "summing-actor")

    values.foreach(summingActor ! AddValue(_))

    def receive = {
      case Sum(value) =>
        valuesSummed = valuesSummed + 1
        if (valuesSummed == values.size) {
          sum = value
          log.info(s"Final sum = ${sum}")
          replyTo.foreach(_ ! Sum(value))
        }
    }
  }

  object MainActor {

    def props(values: Seq[Int], replyTo: Option[ActorRef] = None) =
      Props(new MainActor(values, replyTo))
  }

  val values = Seq(1, 2, 3, 4, 5)
  val system = ActorSystem()
  system.actorOf(MainActor.props(values), "main-actor")
}
