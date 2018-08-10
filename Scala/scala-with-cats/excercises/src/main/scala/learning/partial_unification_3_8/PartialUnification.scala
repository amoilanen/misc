package learning.partial_unification_3_8

//import cats.Functor
import cats.instances.function._
import cats.syntax.functor._

object PartialUnification extends App {

  val func1 = (x: Int) => x.toDouble
  val func2 = (y: Double) => y * 2
  val func3 = func1.map(func2)

  val func3a: Int => Double =
    (a: Int) => func2(func1(a))

  val func3b: Int => Double =
    func2.compose(func1)

  //Won't compile because of the compiler's left to right bias
  //val func3c = func2.contramap(func1)

  type <=[B, A] = A => B
  val func2b: Double <= Double = func2

  //This should compile
  //val func3d = func2b.contramap(func1)

  println(func3(2))
  //println(func3d(3))
}
