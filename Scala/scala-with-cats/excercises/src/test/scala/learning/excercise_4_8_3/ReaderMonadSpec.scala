package learning.excercise_4_8_3

import org.scalatest.{Matchers, WordSpec}

import ReaderMonad._

class ReaderMonadSpec extends WordSpec with Matchers {

  val users = Map(
    1 -> "dade",
    2 -> "kate",
    3 -> "margo"
  )
  val passwords = Map(
    "dade" -> "zerocool",
    "kate" -> "acidburn",
    "margo" -> "secret"
  )

  val db = Db(users, passwords)

  "checkLogin" should {

    "check correct user id/correct password" in {
      checkLogin(userId = 1,  password ="zerocool")(db) shouldBe true
    }

    "check correct user id/incorrect password" in {
      checkLogin(userId = 1,  password ="wrongPassword")(db) shouldBe false
    }

    "check incorrect user id/incorrect password" in {
      checkLogin(userId = 4,  password ="zerocool")(db) shouldBe false
    }
  }
}

