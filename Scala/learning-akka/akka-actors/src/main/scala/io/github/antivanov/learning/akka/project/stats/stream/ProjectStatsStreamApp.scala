package io.github.antivanov.learning.akka.project.stats.stream

import java.io.File

import scala.io.{Source => IOSource}
import akka.actor.ActorSystem
import akka.stream.scaladsl.Sink
import io.github.antivanov.learning.akka.project.stats.util.FileExtension

import scala.concurrent.{ExecutionContext, Future}

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

  implicit val system: ActorSystem = ActorSystem("compute-project-stats")
  implicit val ec: ExecutionContext = system.dispatcher

  val source = FilesSource.fromDirectory(new File("."))

  val result: Future[Map[FileExtension, Long]] = source
    .map(fileToFileStats)
    .groupBy(MaxExtensions, _.extension)
    .reduce(_.add(_))
    .mergeSubstreams
    .runWith(
      Sink.fold(Map[FileExtension, Long]())((map, fileStats) =>
        map + (fileStats.extension -> fileStats.linesCount)))

  result.andThen { lineCounts =>
    println("Final line counts:")
    println(lineCounts)
    system.terminate()
  }
  //TODO: Error handling
  //TODO: Handle arguments
}
