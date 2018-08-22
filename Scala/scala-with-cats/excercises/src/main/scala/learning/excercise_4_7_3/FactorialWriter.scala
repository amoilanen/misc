package learning.excercise_4_7_3

object FactorialWriter {

  def slowly[A](body: => A): A =
    try {
      body
    } finally {
      Thread.sleep(100)
    }

  def factorial(n: Int): Int = {
    val ans = slowly(if(n == 0) 1 else n * factorial(n - 1))
    println(s"fact $n $ans")
    ans
  }

}
