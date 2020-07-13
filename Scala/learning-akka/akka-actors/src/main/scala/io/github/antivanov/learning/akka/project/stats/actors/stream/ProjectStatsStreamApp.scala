package io.github.antivanov.learning.akka.project.stats.actors.stream

import java.io.File

import akka.actor.ActorSystem
import akka.stream.scaladsl.Sink

object ProjectStatsStreamApp extends App {

  implicit val system = ActorSystem("compute-project-stats")

  val source = FilesSource.fromDirectory(new File("."))

  source.runWith(Sink.foreach(println))
}
