import scala.util.Try
import scala.concurrent.{Future, Await}
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

case class TestResults(successful: Int, failed: Int):
  def appendFailure: TestResults =
    this.copy(failed = this.failed + 1)

  def appendSuccess: TestResults =
    this.copy(successful = this.successful + 1)

def runTestCase[A](resultsSoFar: TestResults, testCase: () => Future[A] | Try[A] | Unit): Future[TestResults] =
  try
    testCase() match
      case _: Unit =>
        Future.successful(resultsSoFar.appendSuccess)
      case result: Future[_] =>
         result.map(_ =>
           resultsSoFar.appendSuccess
         ).recover({
           case _: Throwable =>
             resultsSoFar.appendFailure
         })
      case result: Try[_] =>
        result.fold(
          _ => Future.successful(resultsSoFar.appendFailure),
          _ => Future.successful(resultsSoFar.appendSuccess)
        )
  catch
    case _ =>
      Future.successful(resultsSoFar.copy(failed = resultsSoFar.failed + 1))


@main def doMain: Unit =
  val testCases: List[() => Future[Unit] | Try[Unit] | Unit] = List(
    () => Future.successful(()),
    () => Future.failed[Unit](new RuntimeException("unexpected failure")),
    () => (),
    () => throw new RuntimeException("unexpected failure"),
    () => Try(()),
    () => Try[Unit](throw new RuntimeException("unexpected failure"))
  )
  val testResults = testCases.foldLeft(Future.successful(TestResults(successful = 0, failed = 0)))((resultsSoFar, testCase) =>
    resultsSoFar.flatMap(runTestCase(_, testCase))
  )
  println(Await.result(testResults, 1.second))
