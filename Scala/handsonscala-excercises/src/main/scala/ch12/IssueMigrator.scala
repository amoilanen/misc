package ch12

import ch12.github.{Issue, IssueComment}

object IssueMigrator extends App {

  def cloneIssuesInRepo(repo: String, issues: List[Issue]): List[Issue] =
    issues.map({ case Issue(url, htmlUrl, number, title, body, user, _, _) =>
      println(s"Cloning issue $url in $repo")
      val issueBody = s"""
$body
ID: $number
Original Author: $user
Original Issue: $htmlUrl/issues/$number
      """
      GitHubApi.createIssue(token, destRepo, title, issueBody)
    })

  def replicateIssueState(originalAndClonedIssues: Map[Issue, Issue]): Unit = {
    originalAndClonedIssues.keys.foreach({ case issue =>
      if (issue.state == "closed") {
        val clonedIssue = originalAndClonedIssues(issue)
        println(s"Closing cloned issue ${clonedIssue.url} since original issue ${issue.url} is closed")
        GitHubApi.updateIssueState(token, destRepo, clonedIssue.number, issue.state)
      }
    })
  }

  def replicateIssueComments(originalAndClonedIssues: Map[Issue, Issue]): Unit = {
    originalAndClonedIssues.keys.foreach({ case issue =>
      val clonedIssue = originalAndClonedIssues(issue)
      println(s"Commenting on cloned issue ${clonedIssue.url}, copying comments from original issue ${issue.url}")
      issue.comments.foreach({ case IssueComment(_, user, body) =>
        val commentBody = s"$body\nOriginal Author:$user"
        GitHubApi.addComment(token, destRepo, clonedIssue.number, commentBody)
      })
    })
  }

  val srcRepo = "antivanov/testrepo1"
  val destRepo = "antivanov/testrepo2"
  val token = os.read(os.home / "github_token.txt").trim

  println(s"Migrating issues from $srcRepo to $destRepo")
  val issues = GitHubApi.getIssuesWithComments(token, srcRepo)
  val clonedIssues = cloneIssuesInRepo(destRepo, issues)
  val originalAndClonedIssues: Map[Issue, Issue] = issues.zip(clonedIssues).toMap
  replicateIssueState(originalAndClonedIssues)
  replicateIssueComments(originalAndClonedIssues)
}
