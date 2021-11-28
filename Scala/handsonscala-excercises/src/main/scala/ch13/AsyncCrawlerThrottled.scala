package ch13

import java.util.concurrent.Executors
import scala.concurrent.{Await, ExecutionContext, ExecutionContextExecutor, Future}
import scala.concurrent.duration.Duration.Inf

object AsyncCrawlerThrottled extends App {

  val MaxConcurrency = 32
  val threadPoolExecutor = Executors.newFixedThreadPool(MaxConcurrency)
  implicit val ec: ExecutionContextExecutor = ExecutionContext.fromExecutor(threadPoolExecutor)

  def fetchTitles(title: String): Future[Seq[String]] = Future {
    requests.get(
      "https://en.wikipedia.org/w/api.php",
      params = Seq(
        "action" -> "query",
        "titles" -> title,
        "prop" -> "links",
        "format" -> "json"
      )
    )
  }.map({ case  resp =>
    for {
      page <- ujson.read(resp.text())("query")("pages").obj.values.toSeq
      links <- page.obj.get("links").toSeq
      link <- links.arr
    } yield link("title").str
  })

  def fetchAllTitles(startTitle: String, depth: Int): Future[Set[String]] = {
    def traverseCurrentTitles(currentTitles: Set[String], seenTitles: Set[String], currentDepth: Int): Future[Set[String]] = {
      if (currentDepth >= depth)
        Future.successful(seenTitles)
      else
        for {
          fetchedTitles <- Future.sequence(currentTitles.map(fetchTitles)).map(_.flatten)
          updatedSeenTitles = seenTitles ++ currentTitles
          notYetSeenTitles = fetchedTitles.diff(updatedSeenTitles)
          links <- traverseCurrentTitles(notYetSeenTitles, updatedSeenTitles, currentDepth + 1)
        } yield links
    }
    traverseCurrentTitles(Set(startTitle), Set(), 0)
  }

  val results = Await.result(fetchAllTitles("Singapore", 2), Inf)
  print(results)
  threadPoolExecutor.shutdownNow()
}
