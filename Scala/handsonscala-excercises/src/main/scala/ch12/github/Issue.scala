package ch12.github

import ujson.Value

case class Issue(url: String, number: Int, title: String, body: String, user: String, comments: List[IssueComment] = List())

object Issue {

  def issueParser(value: Value): Issue =
    Issue(
      value("url").str,
      value("number").num.toInt,
      value("title").str,
      value("body").str,
      value("user")("login").str
    )
}
