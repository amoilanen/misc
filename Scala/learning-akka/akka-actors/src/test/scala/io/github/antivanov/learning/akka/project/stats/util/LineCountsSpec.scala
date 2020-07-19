package io.github.antivanov.learning.akka.project.stats.util

import org.scalatest.Matchers
import org.scalatest.freespec.AnyFreeSpec

class LineCountsSpec extends AnyFreeSpec with Matchers {

  "report" - {

    "no counts" in {
      LineCounts(Map()).report shouldEqual("")
    }

    "should be sorted by counts" in {
      val counts = LineCounts(Map(
        FileExtension("a") -> 2,
        FileExtension("b") -> 1,
        FileExtension("c") -> 3
      ))
      val expectedReport =
        """c: 3
          |a: 2
          |b: 1""".stripMargin

      counts.report shouldEqual expectedReport
    }
  }
}
