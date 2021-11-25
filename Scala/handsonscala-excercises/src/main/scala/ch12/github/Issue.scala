package ch12.github

import ujson.Value

case class Issue(url: String, htmlUrl: String, number: Int, title: String, body: String, user: String, state: String, comments: List[IssueComment] = List())

object Issue {

  def issueParser(value: Value): Issue =
    Issue(
      value("url").str,
      value("html_url").str,
      value("number").num.toInt,
      value("title").str,
      value("body").str,
      value("user")("login").str,
      value("state").str
    )
}
