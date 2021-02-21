package ch3

import org.scalatest._

import ch3.Chapter3Excercises._

class Chapter3ExcercisesSpec extends FreeSpec with Matchers {

  "flexibleFizzBuzz" - {

    "provides output to the callback" in {
      var output = List[String]()
      flexibleFizzBuzz(15)(s =>
        output = output :+ s
      )
      output shouldEqual List("1", "2", "Fizz", "4", "Buzz",
        "Fizz", "7", "8", "Fizz", "Buzz",
        "11", "Fizz", "13", "14", "FizzBuzz")
    }
  }
}
