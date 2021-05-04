package ch5

object ParseJSONLikeFormat extends App {

  trait Parser[T] {
    def parse(value: String): T
  }

  object ParserInstances {
    //TODO: Simplify and implement as a non-imperative version
    def parseSequenceItems(seq: String): Seq[String] = {
      var pointer = 1
      var itemStartPointer = pointer
      var stack = List[Char]()
      var itemBoundaries = List[(Int, Int)]()
      while (pointer < seq.length - 1) {
        val nextSymbol = seq(pointer)
        if (nextSymbol == '[') {
          stack = List(nextSymbol) ++ stack
        } else if (nextSymbol == ']') {
          if (stack.headOption == Some('[')) {
            stack = stack.drop(1)
          } else {
            stack = List(nextSymbol) ++ stack
          }
        }
        if (stack.isEmpty && (nextSymbol == ',')) {
          itemBoundaries = itemBoundaries ++ List((itemStartPointer, pointer - 1))
          itemStartPointer = pointer + 1 // skip ','
        }
        if (stack.isEmpty && (pointer == seq.length - 2)) {
          itemBoundaries = itemBoundaries ++ List((itemStartPointer, pointer))
        }
        pointer = pointer + 1
      }
      itemBoundaries.map({ case (leftIndex, rightIndex) =>
        seq.substring(leftIndex, rightIndex + 1)
      })
    }

    implicit val StringParser: Parser[String] = (value: String) => value
    implicit val DoubleParser: Parser[Double] = (value: String) => value.toDouble
    implicit val IntParser: Parser[Int] = (value: String) => value.toInt
    implicit val BooleanParser: Parser[Boolean] = (value: String) => value.toBoolean
    implicit def tupleParser[A, B](implicit leftParser: Parser[A], rightParser: Parser[B]): Parser[(A, B)] = (value: String) => {
      val Seq(left: String, right: String) = parseSequenceItems(value)
      (leftParser.parse(left), rightParser.parse(right))
    }
    implicit def sequenceParser[T](implicit parser: Parser[T]): Parser[Seq[T]] = (value: String) =>
      parseSequenceItems(value).map(parser.parse(_))
  }

  def parseFromString[T](input: String)(implicit parser: Parser[T]): T =
    parser.parse(input)

  val input = "[[[1],[true]],[[2,3],[false,true]],[[4,5,6],[false,true,false]]]"
  ParserInstances.parseSequenceItems(input).foreach(println(_))

  val input2 = "[true,false,true]"
  ParserInstances.parseSequenceItems(input2).foreach(println(_))
}
