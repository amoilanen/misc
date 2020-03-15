package io.github.antivanov.learning.akka

import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, Props}

case class AddValue(ref: ActorRef, value: Int)
case class Sum(value: Int)

class ClassicSummingActor extends Actor with ActorLogging {

  var sum = 0

  def receive = {
    case AddValue(ref, value) =>
      log.info(s"Adding ${value}")
      sum = sum + value
      ref ! Sum(sum)
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

  values.foreach(summingActor ! AddValue(self, _))

  def receive = {
    case Sum(value) =>
      log.info(s"Sum = ${value}")
  }
}

object ClassicMainActor {

  def props(values: Seq[Int]) =
    Props(new ClassicMainActor(values))
}

object SummingClassicActorExample extends App {
  val values = Seq(1, 2, 3, 4, 5)
  val system = ActorSystem()
  system.actorOf(Props(new ClassicMainActor(values)), "main-actor")
}
