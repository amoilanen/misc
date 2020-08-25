package io.github.antivanov.learning.akka.project.stats.util

import java.io.File

trait FileWalkerLike {

  def listFiles(file: File, excludePaths: List[String] = FileWalker.DefaultExcludePaths): List[File]
}

object FileWalker extends FileWalkerLike {

  val DefaultExcludePaths = List(".idea", ".git", "target", "project", "node_modules", ".gitignore").map(pathPart => f"$pathPart/")

  override def listFiles(file: File, excludePaths: List[String] = DefaultExcludePaths): List[File] =
    if (file.isDirectory) {
      file.listFiles().map(listFiles(_)).flatten
        .filter(file =>
          !excludePaths.exists(file.getAbsolutePath.contains(_)) && file.getName.contains(".")
        ).toList
    } else {
      List(file)
    }
}
