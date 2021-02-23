package ch3

import org.scalatest.{FreeSpec, Matchers}

class PrintMessagesSpec extends FreeSpec with Matchers  {

  "renderMessages" - {

    import PrintMessages._

    "renders messages with the required indentation" in {
      val actual = renderMessages(Array(
        new Msg(0, None, "Hello"),
        new Msg(1, Some(0), "World"),
        new Msg(2, None, "I am Cow"),
        new Msg(3, Some(2), "Hear me moo"),
        new Msg(4, Some(2), "Here I stand"),
        new Msg(5, Some(2), "I am Cow"),
        new Msg(6, Some(5), "Here me moo, moo")
      ))
      val expected =
        """#0 Hello
          |    #1 World
          |#2 I am Cow
          |    #3 Hear me moo
          |    #4 Here I stand
          |    #5 I am Cow
          |        #6 Here me moo, moo
          |""".stripMargin
      actual shouldEqual expected
    }
  }
}
