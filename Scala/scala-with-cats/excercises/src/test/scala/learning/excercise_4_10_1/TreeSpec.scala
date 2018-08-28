package learning.excercise_4_10_1

import org.scalatest.{WordSpec, _}

import cats.syntax.flatMap._
import cats.syntax.functor._
import TreeInstances._

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

  "Tree flatMap" should {

    "work with a Leaf" in {
      val leaf: Tree[Int] = Leaf(2)

      leaf.flatMap(x => Leaf[Int](2 * x)) shouldEqual Leaf(4)
    }

    "work with a Branch" in {
      val tree: Tree[Int] = Leaf(1)
      val expected: Tree[Int] = Branch(
        Leaf(1),
        Leaf(1)
      )

      tree.flatMap(x => Branch(Leaf(x), Leaf(x))) shouldEqual expected
    }
  }


  "Tree pure" should {

    "work" in {
      treeMonad.pure(2) shouldEqual Leaf(2)
    }
  }

  //TODO: Tree tailRecM
}
