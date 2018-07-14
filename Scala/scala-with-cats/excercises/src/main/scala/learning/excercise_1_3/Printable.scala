package learning.excercise_1_3

trait Printable[A] {
  def format(value: A): String
}

object PrintableInstances {
  implicit val stringPrint: Printable[String] =
    (value: String) => value
  implicit val intPrint: Printable[Int] =
    (value: Int) => value.toString
}

object Printable {

  def format[A](value: A)(implicit p: Printable[A]): String = p.format(value)

  def print[A](value: A)(implicit p: Printable[A]): Unit = {
    println(format(value))
  }
}