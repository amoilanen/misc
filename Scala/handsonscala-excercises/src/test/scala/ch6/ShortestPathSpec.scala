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
        "a" -> Seq("b", "c"),
        "b" -> Seq("c", "d"),
        "c" -> Seq("d"),
        "d" -> Seq()
      )
    ) shouldEqual List("a", "c", "d")
  }

  "should choose direct path if available" in {
    shortestPath(
      start = "a",
      dest = "c",
      graph = Map(
        "a" -> Seq("b", "c"),
        "b" -> Seq("c", "d"),
        "c" -> Seq("d"),
        "d" -> Seq()
      )
    ) shouldEqual List("a", "c")
  }
}
