package io.github.antivanov.learning.akka.project.stats.stream.util

import java.io.File

import akka.actor.ActorSystem
import akka.stream.scaladsl.{Sink, Source}
import akka.testkit.TestKit
import io.github.antivanov.learning.akka.project.stats.util.{FileWalker, FileWalkerLike}
import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.matchers.should.Matchers

import scala.util.{Failure, Try}

class FileSourceSpec  extends TestKit(ActorSystem("testsystem")) with Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory with ScalaFutures {

  "should produce all the files" in {
    val projectRoot = file("")
    val projectFiles = (1 to 3).map(idx => file(idx.toString)).toList
    val fileWalker = mock[FileWalkerLike]
    (fileWalker.listFiles _).expects(projectRoot, FileWalker.DefaultExcludePaths).returning(projectFiles).anyNumberOfTimes()

    val source = Source.fromGraph(new FilesSource(projectRoot, fileWalker))

    val files: Seq[File] = source.runWith(Sink.seq).futureValue

    files shouldEqual projectFiles
  }

  "should stop if listing files throws an exception" in {
    val projectRoot = file("")
    val error = new RuntimeException("Listing files failed")
    val fileWalker = mock[FileWalkerLike]
    (fileWalker.listFiles _).expects(projectRoot, FileWalker.DefaultExcludePaths).throwing(error).anyNumberOfTimes()

    val source = Source.fromGraph(new FilesSource(projectRoot, fileWalker))

    val files: Try[Seq[File]] = Try(source.runWith(Sink.seq).futureValue)

    files shouldBe 'failure
  }


}
