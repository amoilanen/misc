package io.github.antivanov.learning.akka.project.stats.actors.classic

import java.io.File

import akka.actor.SupervisorStrategy.Resume
import akka.actor.{Actor, ActorLogging, ActorRef, ActorSystem, OneForOneStrategy, Props}
import akka.routing.RoundRobinPool
import com.typesafe.scalalogging.Logger
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileLineCounter, FileWalker, FileWalkerLike, LineCounts, ProjectStatsArgs}
import io.github.antivanov.learning.akka.project.stats.util.FileLineCounter.defaultFileLineCounter
import org.slf4j.LoggerFactory

import scala.concurrent.{ExecutionContext, Promise}
import scala.util.{Success, Try}

object ProjectStatsClassicApp extends App with ProjectStatsArgs {

  class StatsSummaryComputer(ref: ActorRef) extends Actor with ActorLogging {

    import StatsSummaryComputer._

    var totalFileNumber = 0L
    var handledFileNumber = 0L
    var lineCounts: Map[FileExtension, Long] = Map().withDefaultValue(0L)

    def onFileHandled(): Unit = {
      handledFileNumber += 1
      if (handledFileNumber == totalFileNumber) {
        ref ! ProjectReader.StatsReady(lineCounts)
      }
    }

    override def receive: Receive = {
      case TotalNumberOfFiles(fileNumber) =>
        totalFileNumber = fileNumber
      case FileStats(_, extension, linesCount) =>
        lineCounts += extension -> (lineCounts(extension) + linesCount)
        onFileHandled()
      case NoFileStats(_) =>
        onFileHandled()
    }
  }

  object StatsSummaryComputer {
    sealed trait Event
    case class TotalNumberOfFiles(fileNumber: Long) extends Event
    case class FileStats(file: File, extension: FileExtension, linesCount: Long) extends Event
    case class NoFileStats(file: File) extends Event

    def props(ref: ActorRef): Props = Props(new StatsSummaryComputer(ref))
  }

  class FileStatsReader(ref: ActorRef, counter: FileLineCounter) extends Actor with ActorLogging {

    val logger = Logger(LoggerFactory.getLogger(FileStatsReader.getClass))

    import FileStatsReader._

    override def receive: Receive = {
      case ComputeStatsFor(file) =>
        val event: StatsSummaryComputer.Event = Try {
          val lineCount = counter.countLines(file)
          val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)
          StatsSummaryComputer.FileStats(file, FileExtension(extension), lineCount)
        }.fold(
          e => {
            logger.error(f"Error occurred when trying to count lines in file $file", e)
            StatsSummaryComputer.NoFileStats(file)
          },
          identity
        )
        ref ! event
    }
  }

  object FileStatsReader {
    val FileReaderCount = 5

    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event

    def props(ref: ActorRef, counter: FileLineCounter = defaultFileLineCounter): Props = Props(new FileStatsReader(ref, counter))
  }

  class ProjectReader(injectedStatsSummaryComputer: Option[ActorRef],
                      injectedFileStatsReader: Option[ActorRef],
                      fileWalker: FileWalkerLike) extends Actor with ActorLogging {

    override val supervisorStrategy =
      OneForOneStrategy() {
        case _: Exception => Resume
      }

    import ProjectReader._

    val statsSummaryComputer = injectedStatsSummaryComputer.getOrElse(
      context.actorOf(StatsSummaryComputer.props(self), "summary-computer"))

    val fileStatsReader: ActorRef =
      injectedFileStatsReader.getOrElse(
        context.actorOf(RoundRobinPool(FileStatsReader.FileReaderCount).props(FileStatsReader.props(statsSummaryComputer)),
          "file-stats-reader-router"))

    var promise: Option[Promise[LineCounts]] = None
    var finalLineCounts: Map[FileExtension, Long] = Map()

    override def receive: Receive = {
      case ReadProject(projectRoot, lineCountsPromise) =>
        log.debug(f"Reading project structure at ${projectRoot.getAbsolutePath}")
        promise = Some(lineCountsPromise)
        val files = fileWalker.listFiles(projectRoot).map(file =>
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
    case class ReadProject(projectRoot: File, lineCountsPromise: Promise[LineCounts])
    case class StatsReady(lineCounts: Map[FileExtension, Long]) extends Event

    def props(injectedStatsSummaryComputer: Option[ActorRef] = None,
              injectedFileStatsReader: Option[ActorRef] = None,
              fileWalker: FileWalkerLike = FileWalker): Props =
      Props(new ProjectReader(injectedStatsSummaryComputer, injectedFileStatsReader, fileWalker))
  }

  val system = ActorSystem()
  implicit val ec: ExecutionContext = system.dispatcher

  val lineCountsPromise = Promise[LineCounts]()
  val projectReader = system.actorOf(ProjectReader.props(), "project-reader")
  projectReader ! ProjectReader.ReadProject(new File(getProjectDirectory), lineCountsPromise)
  lineCountsPromise.future.andThen { case Success(lineCounts) =>
    println("Final line counts:")
    println(lineCounts.report)
    system.terminate()
  }
}
