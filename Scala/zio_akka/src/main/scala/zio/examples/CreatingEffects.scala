package zio.examples

import cats.syntax.either._
import zio.{IO, ZIO}
import zio.Runtime
import scala.concurrent.ExecutionContext.Implicits.global

object CreatingEffects extends App {

  val runtime = Runtime.default

  val users = List(
    User("1", "1"),
    User("2", "1"),
    User("3", "2")
  )
  val teams = List(
    Team("1"),
    Team("2")
  )

  case class User(userId: String, teamId: String)
  case class Team(teamId: String)

  val maybeId: IO[Option[Nothing], String] = ZIO.fromOption(Some("1"))

  def getUser(userId: String): IO[Throwable, Option[User]] =
    IO.fromEither(users.find(_.userId == userId).asRight)
  def getTeam(teamId: String): IO[Throwable, Team] =
    IO.fromEither(
      teams
        .find(_.teamId == teamId)
        .map(_.asRight)
        .getOrElse(new RuntimeException("Team not found").asLeft)
    )

  val result: IO[Throwable, Option[(User, Team)]] = (for {
    id <- maybeId
    user <- getUser(id).some
    team <- getTeam(user.teamId).asSomeError
  } yield (user, team)).optional

  runtime.unsafeRunToFuture(result).map((r: Option[(User, Team)]) => println(r))
}
