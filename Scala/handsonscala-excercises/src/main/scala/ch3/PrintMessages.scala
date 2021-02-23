package ch3

object PrintMessages {

  val NextLevelIndentation = 4

  class Msg(val id: Int, val parent: Option[Int], val txt: String)

  def renderMessage(msg: Msg, level: Int, messagesGroupedByParent: Map[Option[Int], Array[Msg]]): String = {
    val childMessages = messagesGroupedByParent.get(Some(msg.id)).getOrElse(Array())
    val childMessageRenditions = childMessages
      .map(renderMessage(_, level + 1, messagesGroupedByParent))
      .mkString("")
    val prefix = " " * NextLevelIndentation * level
    s"""${prefix}#${msg.id} ${msg.txt}
       |${childMessageRenditions}""".stripMargin
  }

  def renderMessages(messages: Array[Msg]): String = {
    val messagesGroupedByParent = messages.groupBy(_.parent)
    val topLevelMessages = messagesGroupedByParent.get(None).getOrElse(Array())
    topLevelMessages.map(renderMessage(_, 0, messagesGroupedByParent)).mkString("")
  }

  def printMessages(messages: Array[Msg]): Unit =
     println(renderMessages(messages))
}
