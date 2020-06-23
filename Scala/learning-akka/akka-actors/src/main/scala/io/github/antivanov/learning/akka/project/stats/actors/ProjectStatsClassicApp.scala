package io.github.antivanov.learning.akka.project.stats.actors

import java.io.File

import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, Props}
import akka.pattern.ask

import scala.concurrent.duration._
import scala.io.Source

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

object ProjectStatsClassicApp extends App {

  case class FileExtension(value: String) extends AnyVal

  class StatsSummaryComputer(ref: ActorRef) extends Actor with ActorLogging {

    import StatsSummaryComputer._

    var totalFileNumber = 0L
    var handledFileNumber = 0L
    var lineCounts: Map[FileExtension, Long] = Map().withDefaultValue(0L)

    override def receive: Receive = {
      case TotalNumberOfFiles(fileNumber) =>
        totalFileNumber = fileNumber
      case FileStats(_, extension, linesCount) =>
        lineCounts += extension -> (lineCounts(extension) + linesCount)
        handledFileNumber += 1
        if (handledFileNumber == totalFileNumber) {
          ref ! ProjectReader.StatsReady(lineCounts)
        }
    }
  }

  object StatsSummaryComputer {
    sealed trait Event
    case class TotalNumberOfFiles(fileNumber: Long) extends Event
    case class FileStats(file: File, extension: FileExtension, linesCount: Long) extends Event

    def props(ref: ActorRef): Props = Props(new StatsSummaryComputer(ref))
  }

  class FileStatsReader(ref: ActorRef) extends Actor with ActorLogging {
    import FileStatsReader._

    override def receive: Receive = {
      case ComputeStatsFor(file) =>
        val lineCount = Source.fromFile(file).getLines.size
        val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)

        ref ! StatsSummaryComputer.FileStats(file, FileExtension(extension), lineCount)
    }
  }

  object FileStatsReader {
    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event

    def props(ref: ActorRef): Props = Props(new FileStatsReader(ref))
  }

  class ProjectReader extends Actor with ActorLogging {

    import ProjectReader._

    val statsSummaryComputer = context.actorOf(StatsSummaryComputer.props(self), "summary-computer")
    val fileStatsReader = context.actorOf(FileStatsReader.props(statsSummaryComputer), "file-stats-reader")
    var finalLineCounts: Map[FileExtension, Long] = Map()

    override def receive: Receive = {
      case ReadProject(projectPath) =>
        log.debug(f"Reading project structure at $projectPath")
        val files = FileWalker.listFiles(new File(projectPath)).map(file =>
          fileStatsReader ! FileStatsReader.ComputeStatsFor(file)
        )
        statsSummaryComputer ! StatsSummaryComputer.TotalNumberOfFiles(files.size)
      case StatsReady(lineCounts) =>
        finalLineCounts = lineCounts
      case GetStats =>
        sender() ! finalLineCounts
    }

  }

  object ProjectReader {
    sealed trait Event
    case class ReadProject(projectPath: String)
    case class StatsReady(lineCounts: Map[FileExtension, Long]) extends Event
    case object GetStats extends Event

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
  Thread.sleep(2000)

  val lineCounts = projectReader.ask(ProjectReader.GetStats)(100.millisecond).mapTo[Map[FileExtension, Long]]
  println("Final line counts:")
  println(lineCounts)
  system.terminate()
}
