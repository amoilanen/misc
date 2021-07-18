package ch6

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class ShortestPathSpec extends AnyFreeSpec with Matchers  {

  import ShortestPath._

  List(DepthFirstTraversalStrategy, BreadthFirstTraversalStrategy).foreach(strategy => {

    strategy.getClass.getSimpleName.dropRight(1) - {
      "should prefer shorter path" in {
        shortestPath(
          start = "a",
          dest = "d",
          graph = Map(
            "a" -> Seq(("b", 1), ("c", 1)),
            "b" -> Seq(("c", 1), ("d", 1)),
            "c" -> Seq(("d", 1)),
            "d" -> Seq()
          )
        ) shouldEqual List("a", "b", "d")
      }

      "should choose direct path if available" in {
        shortestPath(
          start = "a",
          dest = "c",
          graph = Map(
            "a" -> Seq(("b", 1), ("c", 1)),
            "b" -> Seq(("c", 1), ("d", 1)),
            "c" -> Seq(("d", 1)),
            "d" -> Seq()
          )
        ) shouldEqual List("a", "c")
      }

      "should be able to take edge length into account" in {
        shortestPath(
          start = "a",
          dest = "c",
          graph = Map(
            "a" -> Seq(("b", 1), ("c", 3)),
            "b" -> Seq(("c", 1)),
            "c" -> Seq()
          )
        ) shouldEqual List("a", "b", "c")
      }
    }
  })


}
