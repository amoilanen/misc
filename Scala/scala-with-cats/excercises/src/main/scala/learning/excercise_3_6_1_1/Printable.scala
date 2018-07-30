package learning.excercise_3_6_1_1

trait Printable[A] { self =>

  def format(value: A): String

  def contramap[B](func: B => A) = new Printable[B] {
    override def format(value: B): String =
      self.format(func(value))
  }
}

object Printable {

  def format[A](value: A)(implicit p: Printable[A]): String =
    p.format(value)
}
