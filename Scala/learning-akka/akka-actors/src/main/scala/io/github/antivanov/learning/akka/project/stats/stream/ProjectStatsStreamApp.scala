package io.github.antivanov.learning.akka.project.stats.stream

import java.io.File

import scala.io.{Source => IOSource}
import akka.actor.ActorSystem
import akka.stream.scaladsl.Sink
import io.github.antivanov.learning.akka.project.stats.stream.util.FilesSource
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, LineCounts, ProjectStatsArgs}

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success, Try}
import scala.util.control.NonFatal

object ProjectStatsStreamApp extends App with ProjectStatsArgs {

  val MaxExtensions = Integer.MAX_VALUE

  case class FileStats(extension: FileExtension, linesCount: Long) {
    def add(other: FileStats) =
      FileStats(extension, linesCount + other.linesCount)
  }

  def fileToFileStats(file: File): FileStats = {
    val lineCount = Try(IOSource.fromFile(file).getLines.size)
      .toOption
      .getOrElse(0)
    val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)

    FileStats(FileExtension(extension), lineCount)
  }

  implicit val system: ActorSystem = ActorSystem("compute-project-stats")
  implicit val ec: ExecutionContext = system.dispatcher

  val source = FilesSource.fromDirectory(new File(getProjectDirectory))

  val result: Future[String] = source
    .map(fileToFileStats)
    .groupBy(MaxExtensions, _.extension)
    .reduce(_.add(_))
    .mergeSubstreams
    .runWith(
      Sink.fold(Map[FileExtension, Long]())((map, fileStats) =>
        map + (fileStats.extension -> fileStats.linesCount)))
    .map(LineCounts(_).report)

  result.andThen({
    case Success(lineCounts) =>
      println("Final line counts:")
      println(lineCounts)
      system.terminate()
    case Failure(e) =>
      e.printStackTrace()
  })

  //TODO: Error handling
}
