package io.github.antivanov.learning.akka.actors.typed

import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpecLike
import org.scalatest.time.Span
import org.scalatest.time.Milliseconds
import akka.actor.testkit.typed.CapturedLogEvent
import akka.actor.testkit.typed.Effect._
import akka.actor.testkit.typed.scaladsl.BehaviorTestKit
import akka.actor.testkit.typed.scaladsl.TestInbox
import akka.actor.typed._
import akka.actor.typed.scaladsl._
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.StatsSummaryComputer.{CurrentState, TotalNumberOfFiles}
import io.github.antivanov.learning.akka.project.stats.actors.typed.ProjectStatsApp.{ProjectReader, StatsSummaryComputer}
import org.slf4j.event.Level

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
    }

    "should send StatsReady if for one of the files NoFileStats was sent" in new StatsSummaryComputerTestCase {
    }

    "should not send StatsReady when not all the files have been handled" in new StatsSummaryComputerTestCase {
    }
  }
}
