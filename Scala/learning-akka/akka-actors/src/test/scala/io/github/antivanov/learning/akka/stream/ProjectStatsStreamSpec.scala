package io.github.antivanov.learning.akka.stream

import akka.actor.ActorSystem
import akka.stream.scaladsl.Source
import akka.testkit.TestKit
import io.github.antivanov.learning.akka.project.stats.stream.util.FilesSource
import io.github.antivanov.learning.akka.project.stats.util.FileWalker.DefaultExcludePaths
import io.github.antivanov.learning.akka.project.stats.util.{FileExtension, FileLineCounter, FileWalker, FileWalkerLike}
import io.github.antivanov.learning.akka.testutil.FileMocks
import io.github.antivanov.learning.akka.project.stats.stream.ProjectStatsStreamApp._
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Milliseconds, Span}
import scala.concurrent.ExecutionContext.Implicits.global


class ProjectStatsStreamSpec extends TestKit(ActorSystem("testsystem")) with Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory with ScalaFutures {

  override implicit val patienceConfig: PatienceConfig = PatienceConfig(timeout = Span(1000, Milliseconds), interval = Span(100, Milliseconds))

  "first test" in {
    val files = List(file("1.txt"), file("2.txt"), file("3.txt"))
    val directoryRoot = dir("", files: _*)
    val fileWalker = mock[FileWalkerLike]
    (fileWalker.listFiles _).expects(directoryRoot, DefaultExcludePaths).returning(files)
    val source = new FilesSource(directoryRoot, fileWalker)
    val fileLineCounter = mock[FileLineCounter]
    (fileLineCounter.countLines _).expects(*).returning(1)

    val lineComputer = new ProjectStatsComputer(fileLineCounter)

    val fileLineCounts: Map[FileExtension, Long] = lineComputer.computeLineCounts(Source.fromGraph(source)).futureValue

    fileLineCounts shouldEqual Map("txt" -> 3)
  }
}
