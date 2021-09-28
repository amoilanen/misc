package ch11

import org.jsoup.Jsoup
import org.jsoup.nodes.{Document, Element}

object DiscussionTree extends App {
  import JSoupConversions._

  case class Comment(author: String, text: String)

  def parseComment(commentRoot: Element): Comment = {
    val author = commentRoot.querySelector(".details .byline > a:nth-of-type(3)").map(_.text()).getOrElse("unknown")
    val text = commentRoot.querySelector(".comment_text > p").map(_.text()).getOrElse("")
    Comment(author, text)
  }

  val root: Document = Jsoup.connect("https://raw.githubusercontent.com/handsonscala/handsonscala/v1/resources/11/Lobsters.html").get
  val commentsRoot = root.querySelector("#inside > .comments").get
  val comments = root.querySelectorAll(".comments_subtree").filter(commentsRoot.children().contains(_)).map(parseComment)
  println(comments)
  //TODO: Recursive parsing until all the children were parsed/no more child comments
}
