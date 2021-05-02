package ch5

trait Delayer {
  def wait(delayMs: Int): Unit
}

object DefaultDelayer extends Delayer {
  override def wait(delayMs: Int): Unit =
    Thread.sleep(delayMs)
}

class Retry(delayer: Delayer = DefaultDelayer) {
  def retry[T](max: Int, delayMs: Int)(f: => Either[Throwable, T]): Either[Throwable, T] = {
    val noMoreRetriesError: Either[Throwable, T] = Left(new RuntimeException("Maximum number of retries reached"))
    val delays = LazyList.from(0).map(Math.pow(2, _).toInt * delayMs).take(max).toList

    delays.foldLeft(noMoreRetriesError)((result, delay) =>
      result match {
        case Right(_) => result
        case Left(_) => {
          delayer.wait(delay)
          f.fold(_ =>
            result,
            Right(_)
          )
        }
      }
    )
  }
}

object Retry extends App {

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
  println(result)
  println(recordingDelayer.delays)
}
