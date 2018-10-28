package learning.case_study_map_reduce

import java.util.concurrent.Executors

import org.scalatest.{Matchers, WordSpec}
import cats.instances.int._
import cats.instances.string._
import MapReduce._

import scala.concurrent.ExecutionContext

class MapReduceSpec extends WordSpec with Matchers {

  "foldMap" should {

    "should work with a vector of Integers" in {
      foldMap(Vector(1, 2, 3))(identity) shouldEqual 6
    }

    "should work with a vector of Strings" in {
      foldMap(Vector(1, 2, 3))(_.toString + "! ") shouldEqual "1! 2! 3! "
    }

    "should map over string to produce string" in {
      foldMap("Hello world!".toVector)(_.toString.toUpperCase)
    }
  }

  "parallelFoldMap" should {

    val parallelism = Runtime.getRuntime.availableProcessors()
    implicit val ec = ExecutionContext.fromExecutor(Executors.newFixedThreadPool(parallelism))

    "should work with a vector of Integers" in {
      parallelFoldMap((1 to 200).toVector)(identity) shouldEqual 20100
    }
  }
}
