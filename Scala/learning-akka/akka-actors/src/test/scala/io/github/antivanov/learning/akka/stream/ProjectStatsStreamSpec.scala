package io.github.antivanov.learning.akka.stream

import akka.actor.ActorSystem
import akka.stream.scaladsl.Source
import akka.testkit.TestKit
import io.github.antivanov.learning.akka.project.stats.stream.util.FilesSource
import io.github.antivanov.learning.akka.project.stats.util.FileWalker.DefaultExcludePaths
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileLineCounter, FileWalkerLike}
import io.github.antivanov.learning.akka.testutil.FileMocks
import io.github.antivanov.learning.akka.project.stats.stream.ProjectStatsStreamApp._
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Milliseconds, Span}

import scala.util.control.NonFatal


class ProjectStatsStreamSpec extends TestKit(ActorSystem("testsystem")) with Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory with ScalaFutures {

  override implicit val patienceConfig: PatienceConfig = PatienceConfig(timeout = Span(1000, Milliseconds), interval = Span(100, Milliseconds))

  trait ProjectStatsStreamTestCase {
    val files = List(file("1.txt"), file("2.txt"), file("3.txt"))
    val List(file1, file2, file3) = files
    val directoryRoot = dir("", files: _*)
    val fileWalker = mock[FileWalkerLike]
    val source = new FilesSource(directoryRoot, fileWalker)
    val fileLineCounter = mock[FileLineCounter]

    val lineComputer = new ProjectStatsComputer(fileLineCounter)
  }

  "compute stats in a project directory" in new ProjectStatsStreamTestCase {
    (fileWalker.listFiles _).expects(directoryRoot, DefaultExcludePaths).returning(files).anyNumberOfTimes()
    files.zipWithIndex.foreach({ case (file, idx) =>
      (fileLineCounter.countLines _).expects(file).returning(idx + 1).anyNumberOfTimes()
    })

    val fileLineCounts: Map[FileExtension, Long] = lineComputer.computeLineCounts(Source.fromGraph(source)).futureValue

    fileLineCounts shouldEqual Map(FileExtension("txt") -> 6)
  }

  "return error if FileWalker throws an error" in new ProjectStatsStreamTestCase {
    val error = new RuntimeException("Failed to list the files")
    (fileWalker.listFiles _).expects(*, *).throwing(error)

    val interceptedError = intercept[Exception] {
      lineComputer.computeLineCounts(Source.fromGraph(source)).futureValue
    }
    interceptedError.getCause shouldEqual error
  }

  "exclude the files for which reading stats fails" in new ProjectStatsStreamTestCase {
    val lineCountingError = new RuntimeException("Failed to count lines inside the file")
    (fileWalker.listFiles _).expects(directoryRoot, DefaultExcludePaths).returning(files).anyNumberOfTimes()
    (fileLineCounter.countLines _).expects(file1).returning(1).anyNumberOfTimes()
    (fileLineCounter.countLines _).expects(file2).throwing(lineCountingError).anyNumberOfTimes()
    (fileLineCounter.countLines _).expects(file3).returning(3).anyNumberOfTimes()

    val fileLineCounts: Map[FileExtension, Long] = lineComputer.computeLineCounts(Source.fromGraph(source)).futureValue

    fileLineCounts shouldEqual Map(FileExtension("txt") -> 4)
  }
}