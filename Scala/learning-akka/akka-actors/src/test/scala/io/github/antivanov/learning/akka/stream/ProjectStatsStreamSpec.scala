package io.github.antivanov.learning.akka.stream

import akka.actor.ActorSystem
import akka.stream.{CompletionStrategy, OverflowStrategy}
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.testkit.TestKit
import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.SpanSugar.convertIntToGrainOfTime

import scala.concurrent.Await
import scala.util.control.NonFatal

class ProjectStatsStreamSpec extends TestKit(ActorSystem("testsystem")) with Matchers
  with AnyFreeSpecLike with BeforeAndAfterAll with FileMocks with MockFactory with ScalaFutures {


  "first test" in {
    //TODO:
  }
}
