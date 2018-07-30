package learning.excercise_3_6_1_1

import org.scalatest.{WordSpec, _}

class PrintableSpec extends WordSpec with Matchers {

  val stringPrintable: Printable[String] = new Printable[String] {

    override def format(value: String) = value
  }

  "Printable contramap" should {

    "convert Printable" in {
      val intPrintable: Printable[Int] = stringPrintable.contramap {
        (number: Int) => number.toString()
      }
      intPrintable.format(5) shouldEqual "5"
    }
  }
}

