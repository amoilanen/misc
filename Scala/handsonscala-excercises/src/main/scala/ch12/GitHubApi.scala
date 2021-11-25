package ch12

import Http._
import ch12.IssueMigrator.{destRepo, token}
import ch12.github.{Issue, IssueComment}
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

  def createIssue(token: String, repo: String, title: String, body: String): Int = {
    val resp = req.post(
      s"https://api.github.com/repos/$repo/issues",
      data = ujson.Obj(
        "title" -> title,
        "body" -> body
      ),
      headers = Map("Authorization" -> s"token $token")
    )
    ujson.read(resp.text())("number").num.toInt
  }

  def addComment(token: String, repo: String, issueNumber: Int, body: String): Unit = {
    req.post(
      s"https://api.github.com/repos/$repo/issues/$issueNumber/comments",
      data = ujson.Obj("body" -> body),
      headers = Map("Authorization" -> s"token $token")
    )
  }

  def getIssuesWithComments(token: String, repo: String): List[Issue] = {
    val issues = getIssues(token, repo)

    issues.map(issue => {
      val comments = getIssueComments(token, repo, issue.number)
      issue.copy(comments = comments)
    })
  }

  def getIssues(token: String, repo: String): List[Issue] = {
    val issues =
      Fetch(token, s"https://api.github.com/repos/$repo/issues", "state" -> "all").getJson()

    issues.filter(!_.obj.contains("pull_request")).map({ case issueFields =>
      Issue(
        issueFields("url").str,
        issueFields("number").num.toInt,
        issueFields("title").str,
        issueFields("body").str,
        issueFields("user")("login").str
      )
    })
  }

  def getIssueComments(token: String, repo: String, issueNumber: Int): List[IssueComment] = {
    val comments = Fetch(token, s"https://api.github.com/repos/$repo/issues/$issueNumber/comments").getJson()

    comments.map(commentFields =>
      IssueComment(
        commentFields("url").str,
        commentFields("user")("login").str,
        commentFields("body").str
      )
    )
  }
}
