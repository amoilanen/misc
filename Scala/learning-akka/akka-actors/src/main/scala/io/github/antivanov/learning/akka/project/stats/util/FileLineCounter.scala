package io.github.antivanov.learning.akka.project.stats.util

import java.io.File

import scala.io.Source

trait FileLineCounter {

  def countLines(file: File): Long
}

object FileLineCounter {
  val defaultFileLineCounter = new FileLineCounter {
    override def countLines(file: File): Long =
      Source.fromFile(file).getLines.size
  }
}
