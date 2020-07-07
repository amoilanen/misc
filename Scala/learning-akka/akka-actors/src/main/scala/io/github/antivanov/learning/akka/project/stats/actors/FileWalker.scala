package io.github.antivanov.learning.akka.project.stats.actors

import java.io.File

case class FileExtension(value: String) extends AnyVal

object FileWalker {

  val DefaultExcludePaths = List(".idea", "target", "project", "node_modules", ".gitignore").map(pathPart => f"/$pathPart")

  def listFiles(file: File, excludePaths: List[String] = DefaultExcludePaths): List[File] =
    if (file.isDirectory) {
      file.listFiles().map(listFiles(_)).flatten
        .filter(file =>
          !excludePaths.exists(file.getAbsolutePath.contains(_))
        ).toList
    } else {
      List(file)
    }
}
