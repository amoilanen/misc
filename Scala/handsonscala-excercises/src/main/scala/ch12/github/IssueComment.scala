package ch12.github

import ujson.Value

case class IssueComment(url: String, user: String, body: String)

object IssueComment {

  def commentParser(value: Value): IssueComment =
    IssueComment(
      value("url").str,
      value("user")("login").str,
      value("body").str
    )
}
