package io.github.antivanov.learning.akka.project.stats.actors.stream

import java.io.File

import scala.io.{ Source => IOSource }
import akka.actor.ActorSystem
import akka.stream.scaladsl.Sink

import io.github.antivanov.learning.akka.project.stats.actors.FileExtension

object ProjectStatsStreamApp extends App {

  val MaxExtensions = Integer.MAX_VALUE

  case class FileStats(extension: FileExtension, linesCount: Long) {
    def add(other: FileStats) =
      FileStats(extension, linesCount + other.linesCount)
  }

  def fileToFileStats(file: File): FileStats = {
    val lineCount = IOSource.fromFile(file).getLines.size
    val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)

    FileStats(FileExtension(extension), lineCount)
  }

  implicit val system = ActorSystem("compute-project-stats")

  val source = FilesSource.fromDirectory(new File("."))

  source
    .map(fileToFileStats)
    .groupBy(MaxExtensions, _.extension)
    .reduce(_.add(_))
    .mergeSubstreams
    .fold(Map[FileExtension, Long]())((map, fileStats) =>
      map + (fileStats.extension -> fileStats.linesCount)
    )
    .runWith(Sink.foreach(println))
}
