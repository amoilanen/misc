package learning

import cats.data.State

object StateMonad extends App {

  val step1 = State[Int, String] { num =>
    val ans = num + 1
    (ans, s"Result of step1: $ans")
  }

  val step2 = State[Int, String] { num =>
    val ans = num * 2
    (ans, s"Result of step2: $ans")
  }

  val both: State[Int, (String, String)] = for {
    a <- step1
    b <- step2
  } yield (a, b)

  val both2: State[Int, (String, String)] = step1.flatMap(s1 => {
    val y = step2.map(s2 => (s1, s2))
    y
  })
}
