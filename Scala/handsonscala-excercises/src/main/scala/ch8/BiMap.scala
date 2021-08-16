package ch8

import ujson.Value
import upickle.default

object BiMap {

  case class Foo(i: Int, s: String)

  implicit val fooReadWriter: default.ReadWriter[Foo] = upickle.default.readwriter[ujson.Value].bimap[Foo](
    (p: Foo) => ujson.Obj("i" -> ujson.Num(p.i), "s" -> ujson.Str(p.s)),
    (s: Value) => Foo(s("i").num.toInt, s("s").str)
  )
}
