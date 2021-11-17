package ch12

import requests.Response

//Temporarily mocking requests to not submit actual POST requests
case class MockResponse(value: String, code: Int) {
  def text() = value
  def statusCode() = code
}

object req {
  def post(url: String, headers: Map[String, String], data: Any): MockResponse = {
    println(s"POST $url, $headers \n$data")
    MockResponse("{\"number\": 100}", 200)
  }

  def get(url: String, params: Map[String, String], headers: Map[String, String]): Response =
    requests.get(url, params = params, headers = headers)
}

object IssueMigrator extends App {

  val srcRepo = "antivanov/testrepo1"
  val destRepo = "antivanov/testrepo2"
  val token = os.read(os.home / "github_token.txt").trim

  def fetchPaginated(url: String, params: (String, String)*) = {
    var done = false
    var page = 1
    val responses = collection.mutable.Buffer.empty[ujson.Value]
    while (!done) {
      println("page " + page + "...")
      val resp = req.get(
        url,
        params = Map("page" -> page.toString) ++ params,
        headers = Map("Authorization" -> s"token $token")
      )
      val parsed = ujson.read(resp.text()).arr
      if (parsed.length == 0) done = true
      else responses.appendAll(parsed)
      page += 1
    }
    responses
  }

  val issues =
    fetchPaginated(s"https://api.github.com/repos/$srcRepo/issues", "state" -> "all")

  val nonPullRequests = issues.filter(!_.obj.contains("pull_request"))

  val issueData = for (issue <- nonPullRequests) yield (
    issue("number").num.toInt,
    issue("title").str,
    issue("body").str,
    issue("user")("login").str
  )

  val comments =
    fetchPaginated(s"https://api.github.com/repos/$srcRepo/issues/comments")

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
