package io.github.antivanov.zio.demo.matrix

case class Matrix(values: Array[Array[Int]]) {

  lazy val width = if (values.length > 0)
    values(0).length
  else
    0

  lazy val height = values.length

  override def toString(): String = {
    values.map(_.toSeq).toSeq.toString
  }
}
