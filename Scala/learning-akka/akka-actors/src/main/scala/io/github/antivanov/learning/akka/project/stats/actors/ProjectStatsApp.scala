package io.github.antivanov.learning.akka.project.stats.actors

import java.io.File

import akka.actor.typed.{ActorSystem, Behavior}
import akka.actor.typed.scaladsl.Behaviors

import scala.concurrent.Promise

object ProjectStatsApp extends App {

  object FileStatsReader {

    sealed trait Event
    case class ComputeStatsFor(file: File) extends Event

    def apply(): Behavior[ComputeStatsFor] = {
      Behaviors.ignore
    }
  }

  object StatsSummaryComputer {

    sealed trait Event
    case class TotalNumberOfFiles(fileNumber: Long) extends Event
    case class FileStats(file: File, extension: FileExtension, linesCount: Long) extends Event

    def apply(): Behavior[TotalNumberOfFiles] = {
      Behaviors.ignore
    }
  }

  object ProjectReader {

    sealed trait Event
    case class ReadProject(projectPath: String, lineCountsPromise: Promise[Map[FileExtension, Long]])
    case class StatsReady(lineCounts: Map[FileExtension, Long]) extends Event

    def apply(): Behavior[ReadProject] = Behaviors.setup { context =>

      val fileStatsReader = context.spawn(FileStatsReader(), "file-stats-reader")
      val statsSummaryComputer = context.spawn(StatsSummaryComputer(), "stats-summary-computer")

      Behaviors.receiveMessage[ReadProject] {
        case ReadProject(projectPath, lineCountsPromise) =>
          context.log.debug(f"Reading project structure at $projectPath")
          val promise = Some(lineCountsPromise)
          val files = FileWalker.listFiles(new File(projectPath)).map(file => {
            println(file)
            fileStatsReader ! FileStatsReader.ComputeStatsFor(file)
          })
          statsSummaryComputer ! StatsSummaryComputer.TotalNumberOfFiles(files.size)
          //TODO: Move to the behavior expecting the response from StatsSummaryComputer: StatsReady
          Behaviors.same
      }
    }
  }

  val values = Seq(1, 2, 3, 4, 5)
  val lineCountsPromise = Promise[Map[FileExtension, Long]]()
  val actorSystem = ActorSystem(ProjectReader(), "main-actor")
  actorSystem ! ProjectReader.ReadProject(".", lineCountsPromise)
}
