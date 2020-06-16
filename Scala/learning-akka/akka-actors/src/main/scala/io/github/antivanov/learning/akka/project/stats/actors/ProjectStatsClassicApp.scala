package io.github.antivanov.learning.akka.project.stats.actors

import java.io.File

import akka.actor.{Actor, ActorLogging, ActorSystem, Props}
import io.github.antivanov.learning.akka.project.stats.actors.ProjectStatsClassicApp.FileStatsReader.ComputeStatsFor

import scala.io.Source

object FileWalker {

  val DefaultExcludePaths = List(".idea", "target", "project", "node_modules").map(pathPart => f"/$pathPart")

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

object ProjectStatsClassicApp extends App {

  class FileStatsReader extends Actor with ActorLogging {

    override def receive: Receive = {
      case ComputeStatsFor(file) =>
        val lineCount = Source.fromFile(file).getLines.size
        val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)
        println(file.getAbsolutePath())
        println(extension)
        println(lineCount)
    }
  }

  object FileStatsReader {
    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event
    case class FileStats(extension: String, linesCount: Int) extends Event

    def props: Props = Props(new FileStatsReader)
  }

  class ProjectReader extends Actor with ActorLogging {

    val fileStatsReader = context.actorOf(FileStatsReader.props, "file-stats-reader")

    override def receive: Receive = {
      case ProjectReader.ReadProject(projectPath) =>
        log.debug(f"Reading project structure at $projectPath")
        FileWalker.listFiles(new File(projectPath)).map(file =>
          fileStatsReader ! FileStatsReader.ComputeStatsFor(file)
        )
    }

  }

  object ProjectReader {
    sealed trait Event
    case class ReadProject(projectPath: String)

    def props: Props = Props(new ProjectReader)
  }

  //TODO: RouterPool of actors which read file contents
  //TODO: Separate actors for computing stats for different file extensions
  //TODO: Separate actor to compute the summary of all the project stats:
  // average code lines per ext, total lines for each ext, total files of each ext, total lines and total files
  //TODO: Supervision and error handling

  val system = ActorSystem()
  val projectReader = system.actorOf(ProjectReader.props, "project-reader")
  projectReader ! ProjectReader.ReadProject(".")
}
