case class StringWrapper(value: String)
case class IntWrapper(value: Int)
case class DoubleWrapper(value: Double)

type Wrapper[X] = X match
  case String => StringWrapper
  case Int => IntWrapper

// Dependent typing example using Match Types
def wrapperOf[X](x: X): Wrapper[X] = x match
  case x: String => StringWrapper(x)
  case x: Int => IntWrapper(x)

@main def doMain: Unit =
  val x: Wrapper[String] = wrapperOf("abc")
  val y: Wrapper[Int] = wrapperOf(2)

  // Would fail compilation
  //val z: Wrapper[Double] = DoubleWrapper(2.0)

  println(x)
  println(y)