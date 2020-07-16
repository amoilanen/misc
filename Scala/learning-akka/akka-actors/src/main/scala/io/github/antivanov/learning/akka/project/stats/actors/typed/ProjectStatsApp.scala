package io.github.antivanov.learning.akka.project.stats.actors.typed

import java.io.File

import akka.actor.typed.scaladsl.Behaviors
import akka.actor.typed.{ActorRef, ActorSystem, Behavior}
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileWalker, LineCounts, ProjectStatsArgs}

import scala.concurrent.{ExecutionContext, Promise}
import scala.io.Source
import scala.util.{Success, Try}

object ProjectStatsApp extends App with ProjectStatsArgs {

  object FileStatsReader {

    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event

    def apply(ref: ActorRef[StatsSummaryComputer.FileStats]): Behavior[ComputeStatsFor] = Behaviors.receiveMessage[ComputeStatsFor] { computeStatsFor =>
      val file = computeStatsFor.file
      val lineCount = Try(Source.fromFile(file).getLines.size)
        .toOption
        .getOrElse(0)
      val extension = file.getPath.substring(file.getPath.lastIndexOf('.') + 1)

      ref ! StatsSummaryComputer.FileStats(file, FileExtension(extension), lineCount)
      Behaviors.same
    }
  }

  object StatsSummaryComputer {

    sealed trait Event
    case class TotalNumberOfFiles(fileNumber: Long) extends Event
    case class FileStats(file: File, extension: FileExtension, linesCount: Long) extends Event

    def apply(ref: ActorRef[ProjectReader.Event]): Behavior[Event] =
      receive(ref, totalFileNumber = 0L, handledFileNumber = 0L, lineCounts = Map().withDefaultValue(0L))

    def receive(ref: ActorRef[ProjectReader.Event], totalFileNumber: Long, handledFileNumber: Long, lineCounts: Map[FileExtension, Long]): Behavior[Event] = Behaviors.setup { context =>
      Behaviors.receiveMessage[Event] {
        case TotalNumberOfFiles(updatedTotalFileNumber) =>
          context.log.debug(s"Total number of files $updatedTotalFileNumber")
          receive(ref, updatedTotalFileNumber, handledFileNumber, lineCounts)
        case FileStats(file, extension, linesCount) =>
          val updatedlineCounts = lineCounts + (extension -> (lineCounts(extension) + linesCount))
          val updatedHandledFileNumber = handledFileNumber + 1
          if (updatedHandledFileNumber == totalFileNumber) {
            ref ! ProjectReader.StatsReady(lineCounts)
          }
          context.log.debug(s"File stats ${file.getAbsolutePath}, $linesCount")
          receive(ref, totalFileNumber, updatedHandledFileNumber, updatedlineCounts)
      }
    }
  }

  object ProjectReader {

    sealed trait Event
    case class ReadProject(projectPath: String, lineCountsPromise: Promise[LineCounts]) extends Event
    case class StatsReady(lineCounts: Map[FileExtension, Long]) extends Event

    def apply(): Behavior[Event] = readProject

    def readProject: Behavior[Event] = Behaviors.setup { context =>
      val statsSummaryComputer = context.spawn(StatsSummaryComputer(context.self), "stats-summary-computer")
      val fileStatsReader = context.spawn(FileStatsReader(statsSummaryComputer), "file-stats-reader")

      Behaviors.receiveMessage[Event] {
        case ReadProject(projectPath, lineCountsPromise) =>
          context.log.debug(f"Reading project structure at $projectPath")
          val files = FileWalker.listFiles(new File(projectPath))
          statsSummaryComputer ! StatsSummaryComputer.TotalNumberOfFiles(files.size)
          files.foreach(file => {
            fileStatsReader ! FileStatsReader.ComputeStatsFor(file)
          })

          waitForStatsReady(lineCountsPromise)
        case StatsReady(_) =>
          context.log.error("Project reading has not started yet...")
          Behaviors.same
      }
    }

    def waitForStatsReady(promise: Promise[LineCounts]): Behavior[Event] = Behaviors.receiveMessage[Event] {
      case StatsReady(lineCounts) =>
        promise.success(LineCounts(lineCounts))
        Behaviors.same
    }

  }

  val values = Seq(1, 2, 3, 4, 5)
  val lineCountsPromise = Promise[LineCounts]()
  val actorSystem = ActorSystem(ProjectReader(), "main-actor")
  implicit val ec: ExecutionContext = actorSystem.executionContext
  actorSystem ! ProjectReader.ReadProject(getProjectDirectory, lineCountsPromise)
  lineCountsPromise.future.andThen { case Success(lineCounts) =>
    println("Final line counts:")
    println(lineCounts.report)
    actorSystem.terminate()
  }

  //TODO: Add error handling
}
