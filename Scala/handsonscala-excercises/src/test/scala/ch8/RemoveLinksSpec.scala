package ch8

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class RemoveLinksSpec  extends AnyFreeSpec with Matchers {

  import RemoveLinks._

  "should remove string attributes starting with 'https://', leave other attributes intact" in {
    val input: String =
      """
        |{
        |  "name": "Some name",
        |  "link": "https://someurl"
        |}
        |""".stripMargin
    val readJson = ujson.read(input)
    val httpsLinksOmitted = OmitHttpsLinks.applyTo(readJson)

    httpsLinksOmitted.isDefined shouldBe true
    httpsLinksOmitted.foreach(json => {
      val serialized = upickle.default.write(json)
      serialized shouldEqual """{"name":"Some name"}"""
    })
  }
}
