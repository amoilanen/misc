package ch12.github

case class Issue(url: String, number: Int, title: String, body: String, user: String, comments: List[IssueComment] = List())
