package learning.excercise_1_5_5

import cats.Eq
import cats.instances.int._
import cats.instances.string._
import cats.syntax.eq._

final case class Cat(name: String, age: Int, color: String)

object  beCat {

  implicit val catEq: Eq[Cat] = Eq.instance[Cat] {
    (cat1, cat2) =>
      (cat1.name === cat2.name) &&
      (cat1.age === cat2.age) &&
      (cat1.color === cat2.color)
  }
}
