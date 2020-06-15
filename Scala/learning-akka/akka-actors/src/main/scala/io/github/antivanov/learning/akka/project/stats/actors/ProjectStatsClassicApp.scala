package io.github.antivanov.learning.akka.project.stats.actors

import akka.actor.{Actor, ActorLogging, ActorSystem, Props}

object ProjectStatsClassicApp extends App {

  class ProjectReader extends Actor with ActorLogging {

    override def receive: Receive = {
      case ProjectReader.ReadProject(projectPath) =>
        log.debug(f"Reading project structure at $projectPath")
    }

  }

  object ProjectReader {
    sealed trait Event
    case class ReadProject(projectPath: String)

    def props: Props = Props(new ProjectReader)
  }

  //TODO: Read the files and directories in ProjectReader
  //TODO: RouterPool of actors which read file contents
  //TODO: Separate actors for computing stats for different file extensions
  //TODO: Separate actor to compute the summary of the project stats

  val system = ActorSystem()
  val projectReader = system.actorOf(ProjectReader.props, "main-actor")
  projectReader ! ProjectReader.ReadProject(".")
}
