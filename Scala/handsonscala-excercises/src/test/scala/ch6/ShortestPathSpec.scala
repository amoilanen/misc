package ch6

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class ShortestPathSpec extends AnyFreeSpec with Matchers  {

  import ShortestPath._

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
    ) shouldEqual List("a", "c", "d")
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
}
