package learning.case_study_test_asynchronous_code

import cats.Applicative

import scala.concurrent.Future
import cats.instances.list._
import cats.syntax.traverse._
import cats.syntax.functor._

object AsynchronousCode {

  trait UptimeClient[F[_]] {
    def getUptime(hostname: String): F[Int]
  }

  trait RealUptimeClient extends UptimeClient[Future]

  class UptimeService[F[_]: Applicative](client: UptimeClient[F]) {
    def getTotalUptime(hostnames: List[String]): F[Int] =
      hostnames.traverse(client.getUptime).map(_.sum)
  }
}
