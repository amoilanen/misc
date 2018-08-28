package learning.excercise_4_8_3

object Reader {

  case class Db(
                 usernames: Map[Int, String],
                 passwords: Map[String, String]
               )

}
