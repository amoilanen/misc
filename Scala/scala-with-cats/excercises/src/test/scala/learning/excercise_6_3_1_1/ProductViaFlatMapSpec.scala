package learning.excercise_6_3_1_1

import cats.instances.list._
import org.scalatest.{WordSpec, _}
import ProductViaFlatMap._

class ProductViaFlatMapSpec extends WordSpec with Matchers {

  "product" should {

    "should produce cartesian product with lists" in {
      val x = List(1, 2)
      val y = List(3, 4)

      product(x, y) shouldEqual List((1, 3), (1, 4), (2, 3), (2, 4))
    }
  }
}
