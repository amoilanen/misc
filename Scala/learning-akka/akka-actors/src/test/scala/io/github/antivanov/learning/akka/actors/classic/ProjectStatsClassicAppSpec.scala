package io.github.antivanov.learning.akka.actors.classic

import java.io.File

import akka.actor.ActorSystem
import akka.testkit.{TestActorRef, TestKit, TestProbe}
import io.github.antivanov.learning.akka.project.stats.actors.classic.ProjectStatsClassicApp.FileStatsReader.ComputeStatsFor
import io.github.antivanov.learning.akka.project.stats.actors.classic.ProjectStatsClassicApp.ProjectReader.ReadProject
import io.github.antivanov.learning.akka.project.stats.actors.classic.ProjectStatsClassicApp.StatsSummaryComputer.{FileStats, NoFileStats, TotalNumberOfFiles}
import io.github.antivanov.learning.akka.project.stats.actors.classic.ProjectStatsClassicApp.{FileLineCounter, FileStatsReader, ProjectReader, StatsSummaryComputer}
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileWalker, FileWalkerLike, LineCounts}
import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpecLike

import scala.concurrent.Promise

class ProjectStatsClassicAppSpec extends TestKit(ActorSystem("testsystem")) with Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory {

  override protected def afterAll(): Unit = {
    system.terminate()
  }

  "StatsSummaryComputer" - {

    import StatsSummaryComputer._

    val numberOfFiles = 10
    val extension = ".abc"

    trait StatsSummaryComputerTestCase {
      val ref = TestActorRef[StatsSummaryComputer](StatsSummaryComputer.props(testActor))
    }

    "should handle TotalNumberOfFiles" in new StatsSummaryComputerTestCase {
      ref ! TotalNumberOfFiles(numberOfFiles)
      ref.underlyingActor.totalFileNumber shouldEqual numberOfFiles
    }

    "should send StatsReady when all files were successfully handled" in new StatsSummaryComputerTestCase {
      ref ! TotalNumberOfFiles(numberOfFiles)
      (1 to numberOfFiles).foreach({ idx =>
        ref ! FileStats(mock[MockFile], FileExtension(extension), idx)
      })

      val expectedLineCounts = Map(FileExtension(extension) -> (1 to numberOfFiles).sum.toLong)

      expectMsg(ProjectReader.StatsReady(expectedLineCounts))
      ref.underlyingActor.totalFileNumber shouldEqual numberOfFiles
      ref.underlyingActor.handledFileNumber shouldEqual numberOfFiles
      ref.underlyingActor.lineCounts shouldEqual expectedLineCounts
    }

    "should send StatsReady if for one of the files NoFileStats was sent" in new StatsSummaryComputerTestCase {
      ref ! TotalNumberOfFiles(numberOfFiles)
      ref ! NoFileStats(mock[MockFile])
      (2 to numberOfFiles).foreach({ idx =>
        ref ! FileStats(mock[MockFile], FileExtension(extension), idx)
      })

      val expectedLineCounts = Map(FileExtension(extension) -> (2 to numberOfFiles).sum.toLong)

      expectMsg(ProjectReader.StatsReady(expectedLineCounts))
      ref.underlyingActor.totalFileNumber shouldEqual numberOfFiles
      ref.underlyingActor.handledFileNumber shouldEqual numberOfFiles
      ref.underlyingActor.lineCounts shouldEqual expectedLineCounts
    }

    "should not send StatsReady when not all the files have been handled" in new StatsSummaryComputerTestCase {
      val singleFileLineCount = 5L
      ref ! TotalNumberOfFiles(numberOfFiles)
      ref ! FileStats(mock[MockFile], FileExtension(extension), singleFileLineCount)

      val expectedLineCounts = Map(FileExtension(extension) -> singleFileLineCount)

      expectNoMessage()
      ref.underlyingActor.totalFileNumber shouldEqual numberOfFiles
      ref.underlyingActor.handledFileNumber shouldEqual 1
      ref.underlyingActor.lineCounts shouldEqual expectedLineCounts
    }
  }

  "FileStatsReader" - {

    trait FileStatsReaderTestCase {
      val mockLineCounter = mock[FileLineCounter]
      val ref = TestActorRef(FileStatsReader.props(testActor, mockLineCounter))

      val fileExtension = "java"
      val fileToComputeStatsFor = file(s"abc.$fileExtension")
    }

    "should send file stats to the reference actor" in new FileStatsReaderTestCase {
      (mockLineCounter.countLines _).expects(fileToComputeStatsFor).returning(fileToComputeStatsFor.getPath.length)

      ref ! ComputeStatsFor(fileToComputeStatsFor)

      expectMsg(FileStats(fileToComputeStatsFor, FileExtension(fileExtension), fileToComputeStatsFor.getPath.length))
    }

    "should send 'no stats' message in case an error happens when computing file line count" in new FileStatsReaderTestCase {
      val error = new IllegalStateException("Failed to compute file line count")
      (mockLineCounter.countLines _).expects(fileToComputeStatsFor).throwing(error)

      ref ! ComputeStatsFor(fileToComputeStatsFor)

      expectMsg(NoFileStats(fileToComputeStatsFor))
    }
  }

  "ProjectReader" - {

    trait ProjectReaderTestCase {
      val lineCountsPromise = Promise[LineCounts]()
      val statsSummaryComputer = TestProbe()
      val fileStatsReader = TestProbe()
      val projectRoot = file("")
      val projectFiles = (1 to 3).map(idx => file(idx.toString)).toList
      val fileWalker = mock[FileWalkerLike]
      (fileWalker.listFiles _).expects(projectRoot, FileWalker.DefaultExcludePaths).returning(projectFiles).anyNumberOfTimes()
    }

    "should ask fileStatsReader to read stats for every file and send the total number of files to statsSummaryComputer" in new ProjectReaderTestCase {
      val ref = TestActorRef(ProjectReader.props(Some(statsSummaryComputer.ref), Some(fileStatsReader.ref), fileWalker))

      ref ! ReadProject(projectRoot, lineCountsPromise)

      projectFiles.foreach({ projectFile =>
        fileStatsReader.expectMsg(ComputeStatsFor(projectFile))
      })
      statsSummaryComputer.expectMsg(TotalNumberOfFiles(projectFiles.size))
    }

    //TODO: handle StatsReady
  }
}
