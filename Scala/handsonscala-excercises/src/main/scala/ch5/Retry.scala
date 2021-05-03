package ch5

trait Delayer {
  def wait(delayMs: Int): Unit
}

object DefaultDelayer extends Delayer {
  override def wait(delayMs: Int): Unit =
    Thread.sleep(delayMs)
}

class Retry(delayer: Delayer = DefaultDelayer) {
  val ExponentBase = 2

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