package io.github.antivanov.zio.demo.matrix

case class Matrix(values: Array[Array[Int]]) {

  lazy val width = if (values.length > 0)
    values(0).length
  else
    0

  lazy val height = values.length

  lazy val valuesSeq = values.map(_.toSeq).toSeq

  override def toString(): String =
    valuesSeq.toString

  override def hashCode(): Int = valuesSeq.hashCode()

  override def equals(obj: Any): Boolean = obj match {
    case other: Matrix => other.valuesSeq.equals(valuesSeq)
    case _ => false
  }
}
