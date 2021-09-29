package ch11

import org.jsoup.Jsoup
import org.jsoup.nodes.{Document, Element}
import upickle.default

object DiscussionTree extends App {
  import JSoupConversions._

  case class Comment(author: String, text: String, childComments: List[Comment])

  def jsonWriter(comment: Comment): ujson.Obj = comment match {
    case Comment(author, text, childComments) =>
      val children = if (childComments.size > 0)
        List(
          "childComments" -> ujson.Arr(childComments.map(jsonWriter(_)): _*)
        )
      else
        List()
      val secondaryFields = List("text" -> ujson.Str(text)) ++ children
      ujson.Obj("author" -> ujson.Str(author), secondaryFields:_*)
  }
  implicit val commentWriter: default.Writer[Comment] = upickle.default.writer[ujson.Value].comap(jsonWriter)

  def parseComment(commentRoot: Element): Option[Comment] =
    for {
      author <- commentRoot.querySelector(".details .byline > a:nth-of-type(3)").map(_.text())
      text <- commentRoot.querySelector(".comment_text > p").map(_.text())
    } yield Comment(author, text, getChildComments(commentRoot))

  def getChildComments(commentRoot: Element): List[Comment] = {
    val commentsSection = root.querySelectorAll(".comments").filter(commentRoot.children().contains(_)).head
    val comments = root.querySelectorAll(".comments_subtree").filter(commentsSection.children().contains(_)).map(parseComment).flatten
    comments
  }

  val root: Document = Jsoup.connect("https://raw.githubusercontent.com/handsonscala/handsonscala/v1/resources/11/Lobsters.html").get
  val comments = getChildComments(root.querySelector("#inside").get)

  println(upickle.default.write(comments, indent = 2))
}
