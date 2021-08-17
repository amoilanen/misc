package ch8

object RemoveLinks extends App {

  import ujson._

  trait JsonModification {

    final def applyTo(v: Value): Option[Value] = v match {
      case a: Arr => modifyArr(a)
      case o: Obj => modifyObj(o)
      case s: Str => modifyStr(s)
      case b: Bool => Some(b)
      case n: Num => Some(n)
      case Null => None
    }

    def modifyArr(a: Arr): Option[Arr] =
      Some(Arr(a.arr.flatMap(applyTo)))

    def modifyObj(o: Obj): Option[Obj] =
      Some(Obj.from(o.obj.keys.flatMap(key =>
        applyTo(o.obj(key)).map((key, _))
      )))

    def modifyStr(s: Str): Option[Str] =
      Some(Str(s.str))

    def modifyBool(b: Bool): Option[Bool] =
      Some(b)

    def modifyNum(n: Num): Option[Num] =
      Some(n)
  }

  object OmitHttpsLinks extends JsonModification {
    override def modifyStr(s: Str): Option[Str] =
      if (s.str.startsWith("https://"))
        None
      else
        Some(Str(s.str))
  }
}
