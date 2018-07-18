package learning.excercise_1_4_6

import cats.Show

final case class Cat(name: String, age: Int, color: String)

object Cat {

  implicit val catShow: Show[Cat] =
    (cat: Cat) => s"${cat.name} is a ${cat.age} year-old ${cat.color} cat."
}
