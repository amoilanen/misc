package io.github.antivanov.learning.akka

import akka.actor.{Actor, ActorRef, ActorSystem, Props}
import akka.pattern.{ask, pipe}
import akka.util.Timeout
import com.typesafe.scalalogging.Logger

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

object AskPipeToClassicPatterns extends App {

  trait Event
  case class FindUser(id: Int) extends Event

  case class User(id: Int, name: String)

  object Users {

    val users = Map(
      1 -> User(1, "Dave"),
      2 -> User(2, "Nat"),
      3 -> User(3, "Kate")
    )

    def find(id: Int): Future[Option[User]] =
      Future.successful(users.get(id))
  }

  class UserRegistry extends Actor {

    import context._

    def receive = {
      case FindUser(id) =>
        pipe(Users.find(id)) to sender()
    }
  }

  object UserRegistry {

    def props() = Props(new UserRegistry())
  }

  val logger = Logger("AskPipeToClassicPatterns")

  implicit val askTimeout: Timeout = 2.seconds
  val system = ActorSystem()
  implicit val executionContext: ExecutionContext = system.dispatcher
  val userRegistryRef: ActorRef = system.actorOf(UserRegistry.props(), "user-registry")

  userRegistryRef.ask(FindUser(1)).mapTo[Option[User]].map { user =>
    logger.info(user.toString())
  }
}
