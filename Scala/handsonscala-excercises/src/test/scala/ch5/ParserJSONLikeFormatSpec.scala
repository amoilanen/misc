package ch5

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class ParserJSONLikeFormatSpec extends AnyFreeSpec with Matchers {

  import ParseJSONLikeFormat._

  "parseFromString" - {

    import ParseJSONLikeFormat.ParserInstances._

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

  "serialize to string" - {

    import ParseJSONLikeFormat.SerializerInstances._

    "1 layer of nesting" in {
      writeToString[Seq[Boolean]](Seq(true, false, true)) shouldEqual "[true,false,true]"
    }

    "2 layers of nesting" in {
      writeToString[Seq[(Seq[Int], Seq[Boolean])]](
        Seq(
          (Seq(1), Seq(true)),
          (Seq(2, 3), Seq(false, true)),
          (Seq(4, 5, 6), Seq(false, true, false))
        )
      ) shouldEqual "[[[1],[true]],[[2,3],[false,true]],[[4,5,6],[false,true,false]]]"
    }

    "4 layers of nesting" in {
      writeToString(
        Seq(
          (Seq(1), Seq((true, 0.5))),
          (Seq(2, 3), Seq((false, 1.5), (true, 2.5)))
        )
      )shouldEqual "[[[1],[[true,0.5]]],[[2,3],[[false,1.5],[true,2.5]]]]"
    }
  }
}
