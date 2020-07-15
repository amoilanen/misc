package io.github.antivanov.learning.akka.project.stats.util

import scala.util.Try

trait ProjectStatsArgs { self: App =>

  val defaultProjectDirectory = "."

  def getProjectDirectory(): String =
    Try(args(0)).getOrElse(defaultProjectDirectory)
}
