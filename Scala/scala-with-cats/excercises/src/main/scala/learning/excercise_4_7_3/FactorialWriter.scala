package learning.excercise_4_7_3

import cats.data.Writer
import cats.instances.vector._
import cats.syntax.applicative._

object FactorialWriter {

  def slowly[A](body: => A): A =
    try {
      body
    } finally {
      Thread.sleep(100)
    }

  type Result[A] = Writer[Vector[String], A]

  def factorial(n: Int): Result[Int] = {
    val ans = slowly(if(n == 0) 1.pure[Result] else factorial(n - 1).map(_ * n))
    ans.mapWritten(_ :+ s"fact $n ${ans.value}")
  }

}
