package ch3

object FlexibleFizzBuzz {

  val outputRules = Map(
    3 -> "Fizz",
    5 -> "Buzz"
  )

  def flexibleFizzBuzz(limit: Int)(f: String => Unit): Unit = {
    (1 to limit).map( i => {
      val divisibleByKeys = outputRules.keys.filter(i % _ == 0)
      val nextValue = if (divisibleByKeys.isEmpty)
        i.toString
      else
        divisibleByKeys.map(outputRules(_)).toList.mkString("")
      f(nextValue)
    })
  }
}
