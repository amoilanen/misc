package learning.excercise_1_3

final case class Cat(name: String, age: Int, color: String)

object Cat {

  implicit val catPrint: Printable[Cat] =
    (cat: Cat) => s"${cat.name} is a ${cat.age} year-old ${cat.color} cat."
}