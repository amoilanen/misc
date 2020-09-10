package io.github.antivanov.learning.akka.actors.typed

import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.time.Span
import org.scalatest.time.Milliseconds
import akka.actor.testkit.typed.scaladsl.BehaviorTestKit
import akka.actor.testkit.typed.scaladsl.TestInbox
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.FileStatsReader.ComputeStatsFor
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.ProjectReader.{ReadProject, StatsReady}
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.StatsSummaryComputer.{CurrentState, FileStats, NoFileStats, TotalNumberOfFiles}
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.{FileStatsReader, ProjectReader, StatsSummaryComputer}
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileWalker, FileWalkerLike, LineCounts}
import io.github.antivanov.learning.akka.project.stats.util.FileLineCounter

import scala.concurrent.Promise

class ProjectStatsAppSpec extends Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory with ScalaFutures {

  override implicit val patienceConfig: PatienceConfig = PatienceConfig(timeout = Span(1000, Milliseconds), interval = Span(100, Milliseconds))

  "StatsSummaryComputer" - {

    val numberOfFiles = 10
    val extension = ".abc"

    trait StatsSummaryComputerTestCase {
      val projectReader = TestInbox[ProjectReader.Event]()
      val testProbe = TestInbox[StatsSummaryComputer.CurrentState]()
      val ref =  BehaviorTestKit(StatsSummaryComputer(projectReader.ref, Some(testProbe.ref)))
    }

    "should handle TotalNumberOfFiles" in new StatsSummaryComputerTestCase {
      ref.run(TotalNumberOfFiles(numberOfFiles))
      ref.run(StatsSummaryComputer.GetCurrentState)
      testProbe.expectMessage(CurrentState(10, 0, Map()))
    }

    "should send StatsReady when all files were successfully handled" in new StatsSummaryComputerTestCase {
      ref.run(TotalNumberOfFiles(numberOfFiles))
      (1 to numberOfFiles).foreach({ idx =>
        ref.run(FileStats(file(""), FileExtension(extension), idx))
      })

      val expectedLineCounts = Map(FileExtension(extension) -> (1 to numberOfFiles).sum.toLong)
      projectReader.expectMessage(ProjectReader.StatsReady(expectedLineCounts))
      ref.run(StatsSummaryComputer.GetCurrentState)
      testProbe.expectMessage(CurrentState(numberOfFiles, numberOfFiles, expectedLineCounts))
    }

    "should send StatsReady if for one of the files NoFileStats was sent" in new StatsSummaryComputerTestCase {
      ref.run(TotalNumberOfFiles(numberOfFiles))
      ref.run(NoFileStats(file("")))
      (2 to numberOfFiles).foreach({ idx =>
        ref.run(FileStats(file(""), FileExtension(extension), idx))
      })

      val expectedLineCounts = Map(FileExtension(extension) -> (2 to numberOfFiles).sum.toLong)
      projectReader.expectMessage(ProjectReader.StatsReady(expectedLineCounts))
      ref.run(StatsSummaryComputer.GetCurrentState)
      testProbe.expectMessage(CurrentState(numberOfFiles, numberOfFiles, expectedLineCounts))
    }

    "should not send StatsReady when not all the files have been handled" in new StatsSummaryComputerTestCase {
      val singleFileLineCount = 5L
      ref.run(TotalNumberOfFiles(numberOfFiles))
      ref.run(FileStats(file(""), FileExtension(extension), singleFileLineCount))

      val expectedLineCounts = Map(FileExtension(extension) -> singleFileLineCount)
      projectReader.hasMessages shouldBe false
      ref.run(StatsSummaryComputer.GetCurrentState)
      testProbe.expectMessage(CurrentState(numberOfFiles, 1, expectedLineCounts))
    }
  }

  "FileStatsReader" - {

    trait FileStatsReaderTestCase {
      val mockLineCounter = mock[FileLineCounter]
      val statsSummaryComputer = TestInbox[StatsSummaryComputer.Event]()
      val ref = BehaviorTestKit(FileStatsReader(statsSummaryComputer.ref, mockLineCounter))

      val fileExtension = "java"
      val fileToComputeStatsFor = file(s"abc.$fileExtension")
    }

    "should send file stats to the reference actor" in new FileStatsReaderTestCase {
      (mockLineCounter.countLines _).expects(fileToComputeStatsFor).returning(fileToComputeStatsFor.getPath.length)

      ref.run(ComputeStatsFor(fileToComputeStatsFor))

      statsSummaryComputer.expectMessage(FileStats(fileToComputeStatsFor, FileExtension(fileExtension), fileToComputeStatsFor.getPath.length))
    }

    "should send 'no stats' message in case an error happens when computing file line count" in new FileStatsReaderTestCase {
      val error = new IllegalStateException("Failed to compute file line count")
      (mockLineCounter.countLines _).expects(fileToComputeStatsFor).throwing(error)

      ref.run(ComputeStatsFor(fileToComputeStatsFor))

      statsSummaryComputer.expectMessage(NoFileStats(fileToComputeStatsFor))
    }
  }

  "ProjectReader" - {

    trait ProjectReaderTestCase {
      val lineCountsPromise = Promise[LineCounts]()
      val statsSummaryComputer = TestInbox[StatsSummaryComputer.Event]()
      val fileStatsReader = TestInbox[FileStatsReader.Event]()
      val projectRoot = file("")
      val projectFiles = (1 to 3).map(idx => file(idx.toString)).toList
      val fileWalker = mock[FileWalkerLike]
      (fileWalker.listFiles _).expects(projectRoot, FileWalker.DefaultExcludePaths).returning(projectFiles).anyNumberOfTimes()
      val ref = BehaviorTestKit(ProjectReader(Some(statsSummaryComputer.ref), Some(fileStatsReader.ref), fileWalker))
    }

    "should ask fileStatsReader to read stats for every file and send the total number of files to statsSummaryComputer" in new ProjectReaderTestCase {
      ref.run(ReadProject(projectRoot, lineCountsPromise))

      projectFiles.foreach({ projectFile =>
        fileStatsReader.expectMessage(ComputeStatsFor(projectFile))
      })
      statsSummaryComputer.expectMessage(TotalNumberOfFiles(projectFiles.size))
    }

    "should complete the provided promise on StatsReady" in new ProjectReaderTestCase {
      val expectedStats = Map(
        FileExtension(".txt") -> 1L
      )

      ref.run(ReadProject(projectRoot, lineCountsPromise))
      ref.run(StatsReady(expectedStats))

      val received: LineCounts = lineCountsPromise.future.futureValue
      received shouldEqual LineCounts(expectedStats)
    }
  }
}
