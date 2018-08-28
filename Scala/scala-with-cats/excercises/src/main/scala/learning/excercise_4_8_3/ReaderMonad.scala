package learning.excercise_4_8_3

import cats.data.Reader

object ReaderMonad {

  case class Db(
                 usernames: Map[Int, String],
                 passwords: Map[String, String]
               )

  type DbReader[A] = Reader[Db, A]

  def findUsername(userId: Int): DbReader[Option[String]] =
    Reader(db => db.usernames.get(userId))

  def checkPassword(username: String, password: String): DbReader[Boolean] =
    Reader(db => db.passwords.get(username) == Some(password))

  def checkLogin(userId: Int, password: String): DbReader[Boolean] =
    findUsername(userId).flatMap({
      case Some(username) => checkPassword(username, password)
      case None => Reader(_ => false)
    })
}
