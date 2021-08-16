package ch8

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class BiMapSpec extends AnyFreeSpec with Matchers {

  import BiMap._

  val foo = Foo(2, "some value")
  val serialization = """{"i":2,"s":"some value"}"""

  "serialize" in {
    upickle.default.write(foo) shouldEqual serialization
  }

  "deserialize" in {
    upickle.default.read[Foo](serialization) shouldEqual foo
  }
}
