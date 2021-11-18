package ch12

import Http._
import GitHubApi.Fetch

object IssueMigrator extends App {

  val srcRepo = "antivanov/testrepo1"
  val destRepo = "antivanov/testrepo2"
  val token = os.read(os.home / "github_token.txt").trim

  val issues =
    Fetch(token, s"https://api.github.com/repos/$srcRepo/issues", "state" -> "all").getJson()

  val nonPullRequests = issues.filter(!_.obj.contains("pull_request"))

  val issueData = for (issue <- nonPullRequests) yield (
    issue("number").num.toInt,
    issue("title").str,
    issue("body").str,
    issue("user")("login").str
  )

  val comments =
    Fetch(token, s"https://api.github.com/repos/$srcRepo/issues/comments").getJson()

  val commentData = comments.map({ case comment =>
    val url = comment("issue_url").str match {
      case s"https://api.github.com/repos/$_/$_/issues/$id" => id.toInt
    }
    val user = comment("user")("login").str
    val issueBody = comment("body").str
    (url, user, issueBody)
  })

  val issueNums = for ((number, title, body, user) <- issueData.sortBy(_._1)) yield {
    println(s"Creating issue $number")
    val resp = req.post(
      s"https://api.github.com/repos/$destRepo/issues",
      data = ujson.Obj(
        "title" -> title,
        "body" -> s"$body\nID: $number\nOriginal Author: $user"
      ),
      headers = Map("Authorization" -> s"token $token")
    )
    println(resp.statusCode)
    val newIssueNumber = ujson.read(resp.text())("number").num.toInt
    (number, newIssueNumber)
  }

  val issueNumMap = issueNums.toMap

  for ((issueId, user, body) <- commentData; newIssueId <- issueNumMap.get(issueId)) {
    println(s"Commenting on issue old_id=$issueId new_id=$newIssueId")
    val resp = req.post(
      s"https://api.github.com/repos/$destRepo/issues/$newIssueId/comments",
      data = ujson.Obj("body" -> s"$body\nOriginal Author:$user"),
      headers = Map("Authorization" -> s"token $token")
    )
    println(resp.statusCode)
  }
}
