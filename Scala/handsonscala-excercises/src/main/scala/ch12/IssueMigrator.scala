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
    val issueBody = s"""
        $body
        ID: $number
        Original Author: $user
    """
    val newIssueNumber = GitHubApi.createIssue(token, destRepo, title, issueBody)
    (number, newIssueNumber)
  }

  val oldNumberToNewNumber: Map[Int, Int] = issueNums.toMap

  for (Issue(_, number, _, _, _, comments) <- issues; newIssueNumber <- oldNumberToNewNumber.get(number)) {
    println(s"Commenting on issue old number=$number new number=$newIssueNumber")
    comments.foreach({ case IssueComment(_, user, body) =>
      val commentBody = s"$body\nOriginal Author:$user"
      GitHubApi.addComment(token, destRepo, newIssueNumber, commentBody)
    })
  }
}
