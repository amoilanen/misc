package learning.excercise_3_6_2_1

import org.scalatest.{ WordSpec, _}
import Codec._

class CodecSpec extends WordSpec with Matchers {

  case class Box[A](value: A)

  implicit def boxCodec[A](implicit c: Codec[A]): Codec[Box[A]] =
    Codec[A].imap[Box[A]](value => Box(value), box => box.value)

  "Codec" should {

    def decodeEncode[A](codecName: String, encodedValue: String, decodedValue: A)(implicit c: Codec[A]) = {

      codecName should {

        "encode" in {
          encode(decodedValue) shouldEqual encodedValue
        }

        "decode" in {
          decode[A](encodedValue) shouldEqual decodedValue
        }
      }
    }

    decodeEncode(codecName = "Decode", encodedValue = "123.4", decodedValue = 123.4)
    decodeEncode(codecName = "Boolean", encodedValue = "true", decodedValue = true)
    decodeEncode(codecName = "Int", encodedValue = "123", decodedValue = 123)
    decodeEncode(codecName = "Box", encodedValue = "123.4", decodedValue = Box(123.4))
  }
}