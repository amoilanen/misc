package ch3

object PrintMessages {

  val IndentationPerLevel = 4

  class Msg(val id: Int, val parent: Option[Int], val txt: String)

  class Messages(messages: Array[Msg]) {
    private lazy val messagesGroupedByParent = messages.groupBy(_.parent)
    private lazy val topLevelMessages = messagesGroupedByParent.get(None).getOrElse(Array())

    private def renderMessage(msg: Msg, level: Int): String = {
      val childMessages = messagesGroupedByParent.get(Some(msg.id)).getOrElse(Array())
      val childMessageRenditions = childMessages
        .map(renderMessage(_, level + 1))
        .mkString("")
      val currentMessageIndentation = " " * IndentationPerLevel * level
      s"""${currentMessageIndentation}#${msg.id} ${msg.txt}
         |${childMessageRenditions}""".stripMargin
    }

    def render(): String =
      topLevelMessages.map(renderMessage(_, 0)).mkString("")
  }

  def renderMessages(messages: Array[Msg]): String =
    new Messages(messages).render()

  def printMessages(messages: Array[Msg]): Unit =
     println(renderMessages(messages))
}
