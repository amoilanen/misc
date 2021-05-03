package ch5

import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class RetrySpec extends AnyFreeSpec with Matchers {

  "retry" - {

    "should increase the delay exponentially until succeeding" in {
      class FailingRequest(val succeedOnTryNumber: Int, response: String, private var attemptNumber: Int = 1) {

        def get(url: String): Either[Throwable, String] = {
          attemptNumber = attemptNumber + 1
          if (attemptNumber < succeedOnTryNumber) {
            Left(new RuntimeException(s"Cannot get $url"))
          } else {
            Right(response)
          }
        }
      }

      val response = "Successful response"
      val request = new FailingRequest(succeedOnTryNumber = 6, response = response)

      class RecordingDelayer(var delays: List[Int] = List()) extends Delayer {
        override def wait(delayMs: Int): Unit = {
          delays = delays :+ delayMs
        }
      }
      val recordingDelayer = new RecordingDelayer()
      val backoff = new Retry(delayer = recordingDelayer)

      val result = backoff.retry(max = 50, delayMs = 100) {
        request.get("http:://localhost/status/200,400,500")
      }
      result shouldEqual Right(response)
      recordingDelayer.delays shouldEqual List(100, 200, 400, 800, 1600)
    }

    //TODO: Should call the function only once if it succeeds immediately
    //TODO: Return error if all retries were exhausted
  }
}
