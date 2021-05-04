package ch5

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class ParserJSONLikeFormatSpec extends AnyFreeSpec with Matchers {

  import ParseJSONLikeFormat.ParserInstances._
  import ParseJSONLikeFormat._

  "parseFromString" - {

    "1 layer of nesting" in {
      parseFromString[Seq[Boolean]]("[true,false,true]") shouldEqual List(true, false, true)
    }

    "3 layers of nesting" in {
      parseFromString[Seq[(Seq[Int], Seq[Boolean])]]( //
        "[[[1],[true]],[[2,3],[false,true]],[[4,5,6],[false,true,false]]]"
      ) shouldEqual
        List(
         (List(1), List(true)),
         (List(2, 3), List(false, true)),
         (List(4, 5, 6), List(false, true, false))
        )
    }

    "4 layers of nesting" in {
      parseFromString[Seq[(Seq[Int], Seq[(Boolean, Double)])]]( //
        "[[[1],[[true,0.5]]],[[2,3],[[false,1.5],[true,2.5]]]]"
      ) shouldEqual
        List(
          (List(1), List((true, 0.5))),
          (List(2, 3), List((false, 1.5), (true, 2.5)))
        )
    }
  }
}
