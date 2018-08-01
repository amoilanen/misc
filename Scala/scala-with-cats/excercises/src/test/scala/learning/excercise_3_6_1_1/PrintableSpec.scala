package learning.excercise_3_6_1_1

import org.scalatest.{WordSpec, _}
import Printable._

class PrintableSpec extends WordSpec with Matchers {

  case class Box[A](value: A)

  implicit val stringPrintable: Printable[String] = (value: String) =>
    '"' + value + '"'

  implicit val booleanPrintable: Printable[Boolean] = (value: Boolean) =>
    if (value) "yes" else "no"

  implicit def boxPrintable[A](implicit p: Printable[A]): Printable[Box[A]] =
    Printable[A].contramap[Box[A]](box => box.value)

  "Printable contramap" should {

    "convert Printable" in {
      val intPrintable: Printable[Int] = stringPrintable.contramap {
        (number: Int) => number.toString()
      }
      intPrintable.format(5) shouldEqual "\"5\""
    }
  }

  "Printable Box with contramap" should {

    "format boxed string value" in {
      val value = "abcdef"
      val box = Box(value)

      format(box) shouldEqual '"' + value + '"'
    }

    "format boxed boolean value" in {
      val box = Box(true)

      format(box) shouldEqual "yes"
    }
  }
}

