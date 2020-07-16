package io.github.antivanov.learning.akka.project.stats.actors.classic

import java.io.File

import akka.actor.SupervisorStrategy.Resume
import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, OneForOneStrategy, Props}
import akka.routing.RoundRobinPool
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileWalker, LineCounts, ProjectStatsArgs}

import scala.concurrent.{ExecutionContext, Promise}
import scala.io.Source
import scala.util.{Success, Try}

object ProjectStatsClassicApp extends App with ProjectStatsArgs {

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
        val lineCount = Try(Source.fromFile(file).getLines.size)
          .toOption
          .getOrElse(0)
        val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)

        ref ! StatsSummaryComputer.FileStats(file, FileExtension(extension), lineCount)
    }
  }

  object FileStatsReader {
    val FileReaderCount = 5

    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event

    def props(ref: ActorRef): Props = Props(new FileStatsReader(ref))
  }

  class ProjectReader extends Actor with ActorLogging {

    override val supervisorStrategy =
      OneForOneStrategy() {
        case _: Exception => Resume
      }

    import ProjectReader._

    val statsSummaryComputer = context.actorOf(StatsSummaryComputer.props(self), "summary-computer")

    val fileStatsReader: ActorRef =
      context.actorOf(RoundRobinPool(FileStatsReader.FileReaderCount).props(FileStatsReader.props(statsSummaryComputer)), "file-stats-reader-router")
    var promise: Option[Promise[LineCounts]] = None
    var finalLineCounts: Map[FileExtension, Long] = Map()

    override def receive: Receive = {
      case ReadProject(projectPath, lineCountsPromise) =>
        log.debug(f"Reading project structure at $projectPath")
        promise = Some(lineCountsPromise)
        val files = FileWalker.listFiles(new File(projectPath)).map(file =>
          fileStatsReader ! FileStatsReader.ComputeStatsFor(file)
        )
        statsSummaryComputer ! StatsSummaryComputer.TotalNumberOfFiles(files.size)
      case StatsReady(lineCounts) =>
        finalLineCounts = lineCounts
        promise.map(_.success(LineCounts(lineCounts)))
    }

  }

  object ProjectReader {
    sealed trait Event
    case class ReadProject(projectPath: String, lineCountsPromise: Promise[LineCounts])
    case class StatsReady(lineCounts: Map[FileExtension, Long]) extends Event

    def props: Props = Props(new ProjectReader)
  }

  val system = ActorSystem()
  implicit val ec: ExecutionContext = system.dispatcher

  val lineCountsPromise = Promise[LineCounts]()
  val projectReader = system.actorOf(ProjectReader.props, "project-reader")
  projectReader ! ProjectReader.ReadProject(getProjectDirectory, lineCountsPromise)
  lineCountsPromise.future.andThen { case Success(lineCounts) =>
    println("Final line counts:")
    println(lineCounts.report)
    system.terminate()
  }

  //TODO: Fix error handling
}
