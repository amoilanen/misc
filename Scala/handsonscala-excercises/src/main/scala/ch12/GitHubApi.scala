package ch12

import Http._
import ujson.Value

import scala.annotation.tailrec

object GitHubApi {

  case class Fetch(token: String, url: String, params: (String, String)*) {

    def getJson(): List[Value] =
      fetchNextPage(List(), 1)

    @tailrec
    private def fetchNextPage(accumulatedResults: List[Value], currentPage: Int): List[Value] = {
      val nextPage = fetchPage(currentPage)
      if (nextPage.isEmpty)
        accumulatedResults
      else
        fetchNextPage(accumulatedResults ++ nextPage, currentPage + 1)
    }

    private def fetchPage(page: Int): List[Value] = {
      val resp = req.get(
        url,
        params = Map("page" -> page.toString) ++ params,
        headers = Map("Authorization" -> s"token $token")
      )
      ujson.read(resp.text()).arr.toList
    }
  }


}
