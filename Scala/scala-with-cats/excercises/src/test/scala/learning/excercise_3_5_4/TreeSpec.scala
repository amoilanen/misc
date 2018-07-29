package learning.excercise_3_5_4

import org.scalatest.{WordSpec, _}

import cats.syntax.functor._
import Tree._

class TreeSpec extends WordSpec with Matchers {

  "Tree map" should {

    "should work with Leaf" in {
      val leaf: Tree[Int] = Leaf(1)

      leaf.map(_ * 2) shouldEqual Leaf(2)
    }

    "should work with Branch" in {
      val branch: Tree[String] = Branch(
        Branch(
          Leaf("abc"),
          Leaf("bc")
        ),
        Leaf("c")
      )
      val expected: Tree[Int] = Branch(
        Branch(
          Leaf(3),
          Leaf(2)
        ),
        Leaf(1)
      )

      branch.map(_.length) shouldEqual expected
    }
  }
}

