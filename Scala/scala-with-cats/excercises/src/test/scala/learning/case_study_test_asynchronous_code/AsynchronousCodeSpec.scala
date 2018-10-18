package learning.case_study_test_asynchronous_code

import scala.language.postfixOps
import cats.instances.future._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
import org.scalatest.{Matchers, WordSpec}
import AsynchronousCode._
import cats.Id

class AsynchronousCodeSpec extends WordSpec with Matchers  {

  class TestUptimeClient(hosts: Map[String, Int]) extends UptimeClient[Id] {
    def getUptime(hostname: String): Id[Int] =
      hosts.getOrElse(hostname, 0)
  }

  "uptime client" should {

    "sum uptimes" in {
      val hosts = Map("host1" -> 10, "host2" -> 6)
      val client = new TestUptimeClient(hosts)
      val service = new UptimeService(client)
      val actual = service.getTotalUptime(hosts.keys.toList)
      val expected = hosts.values.sum
      actual shouldEqual expected
    }
  }

  "real uptime client" should {

    class TestRealUptimeClient(hosts: Map[String, Int]) extends UptimeClient[Future] {
      def getUptime(hostname: String): Future[Int] =
        Future.successful(hosts.getOrElse(hostname, 0))
    }

    "sum uptimes" in {
      val hosts = Map("host1" -> 10, "host2" -> 6)
      val client = new TestRealUptimeClient(hosts)
      val service = new UptimeService(client)
      val actual = Await.ready(service.getTotalUptime(hosts.keys.toList), 1 second).value.get.get
      val expected = hosts.values.sum
      actual shouldEqual expected
    }
  }
}
