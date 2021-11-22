package ch12

import Http._
import ch12.github.{Issue, IssueComment}

object IssueMigrator extends App {

  val srcRepo = "antivanov/testrepo1"
  val destRepo = "antivanov/testrepo2"
  val token = os.read(os.home / "github_token.txt").trim

  val issues = GitHubApi.getIssuesWithComments(token, srcRepo)

  val issueNums = for (Issue(_, number, title, body, user, _) <- issues.sortBy(_.number)) yield {
    println(s"Creating issue $number")
    val resp = req.post(
      s"https://api.github.com/repos/$destRepo/issues",
      data = ujson.Obj(
        "title" -> title,
        "body" -> s"""
          $body
          ID: $number
          Original Author: $user
        """
      ),
      headers = Map("Authorization" -> s"token $token")
    )
    println(resp.statusCode)
    val newIssueNumber = ujson.read(resp.text())("number").num.toInt
    (number, newIssueNumber)
  }

  val issueNumMap = issueNums.toMap

  for (Issue(_, number, _, _, _, comments) <- issues; newIssueNumber <- issueNumMap.get(number)) {
    println(s"Commenting on issue old number=$number new number=$newIssueNumber")
    comments.foreach({ case IssueComment(_, user, body) =>
      val resp = req.post(
        s"https://api.github.com/repos/$destRepo/issues/$newIssueNumber/comments",
        data = ujson.Obj("body" -> s"$body\nOriginal Author:$user"),
        headers = Map("Authorization" -> s"token $token")
      )
      println(resp.statusCode)
    })
  }
}
