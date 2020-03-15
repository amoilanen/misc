package io.github.antivanov.learning.akka

import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, Props}

object SummingClassicActorExample extends App {

  object Events {
    case class AddValue(value: Int)
    case class Sum(value: Int)
  }
  import Events._

  class ClassicSummingActor extends Actor with ActorLogging {

    var sum = 0

    def receive = {
      case AddValue(value) =>
        log.info(s"Adding ${value}")
        sum = sum + value
        sender() ! Sum(sum)
    }
  }

  object ClassicSummingActor {

    def props =
      Props(new ClassicSummingActor())
  }

  class ClassicMainActor(values: Seq[Int]) extends Actor with ActorLogging {

    var sum = 0

    val summingActor: ActorRef =
      context.actorOf(ClassicSummingActor.props, "summing-actor")

    values.foreach(summingActor ! AddValue(_))

    def receive = {
      case Sum(value) =>
        log.info(s"Sum = ${value}")
    }
  }

  object ClassicMainActor {

    def props(values: Seq[Int]) =
      Props(new ClassicMainActor(values))
  }

  val values = Seq(1, 2, 3, 4, 5)
  val system = ActorSystem()
  system.actorOf(Props(new ClassicMainActor(values)), "main-actor")
}
