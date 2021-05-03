package ch5

import org.scalamock.scalatest.MockFactory
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class RetrySpec extends AnyFreeSpec with Matchers with MockFactory {

  val url = "http://localhost/some/url"
  val response = "Successful response"

  trait Request {
    def get(url: String): Either[Throwable, String]
  }

  def eventuallySucceedingRequest(url: String, response: String, failuresCount: Int): Request = {
    val requestFailure = Left(new RuntimeException(s"Cannot get url"))
    val request = stub[Request]
    (1 to failuresCount).foreach(_ =>
      (request.get _).when(url).returning(requestFailure).noMoreThanOnce()
    )
    (request.get _).when(url).returning(Right(response)).noMoreThanOnce()
    request
  }

  def noDelayDelayer(): Delayer = {
    val delayer = stub[Delayer]
    (delayer.wait: Int => Unit).when(*).returning(())
    delayer
  }

  "retry" - {

    "should increase the delay exponentially until succeeding" in {
      val request = eventuallySucceedingRequest(url, response, failuresCount = 4)
      val recordingDelayer = noDelayDelayer

      val backoff = new Retry(delayer = recordingDelayer)

      val result = backoff.retry(max = 10, delayMs = 100) {
        request.get(url)
      }

      result shouldEqual Right(response)
      (request.get _).verify(url).repeat(count = 5)
      val expectedDelays = List(100, 200, 400, 800, 1600)
      inSequence {
        expectedDelays.foreach(delay =>
          (recordingDelayer.wait: Int => Unit).verify(delay).once()
        )
      }
      (recordingDelayer.wait: Int => Unit).verify(3200).never()
    }

    "should call the function only once if it immediately succeeds" in {
      val request = eventuallySucceedingRequest(url, response, failuresCount = 0)
      val recordingDelayer = noDelayDelayer

      val backoff = new Retry(delayer = recordingDelayer)

      val result = backoff.retry(max = 10, delayMs = 100) {
        request.get(url)
      }

      result shouldEqual Right(response)
      (request.get _).verify(url).repeat(count = 1)
      (recordingDelayer.wait: Int => Unit).verify(100).once()
      (recordingDelayer.wait: Int => Unit).verify(200).never()
    }

    "should return error after all the retries are done" in {
      val maxRetriesCount = 3
      val request = eventuallySucceedingRequest(url, response, failuresCount = maxRetriesCount)
      val recordingDelayer = noDelayDelayer

      val backoff = new Retry(delayer = recordingDelayer)

      val result = backoff.retry(max = maxRetriesCount, delayMs = 100) {
        request.get(url)
      }

      result.isLeft shouldBe true
      (request.get _).verify(url).repeat(count = maxRetriesCount)
      val expectedDelays = List(100, 200, 400)
      inSequence {
        expectedDelays.foreach(delay =>
          (recordingDelayer.wait: Int => Unit).verify(delay).once()
        )
      }
      (recordingDelayer.wait: Int => Unit).verify(800).never()
    }
  }
}
