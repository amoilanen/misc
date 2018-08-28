package learning

import cats.data.Reader

object CatsReader extends App {

  case class Cat(name: String, favoriteFood: String)

  val catName: Reader[Cat, String] =
    Reader(cat => cat.name)

  val greetKitty: Reader[Cat, String] =
    catName.map(name => s"Hello ${name}")

  val feedKitty: Reader[Cat, String] =
    Reader(cat => s"Have a nice bowl of ${cat.favoriteFood}")

  val greetAndFeed: Reader[Cat, String] =
    greetKitty.flatMap((greet) => {
      feedKitty.map((feed) =>
        s"$greet. $feed."
      )
    })
    /*for {
      greet <- greetKitty
      feed  <- feedKitty
    } yield s"$greet. $feed."
    */

  print(greetAndFeed(Cat("Garfield", "lasagne")))
}
