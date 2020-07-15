package io.github.antivanov.learning.akka.project.stats.stream.util

import java.io.File

import akka.NotUsed
import akka.stream.scaladsl.Source
import akka.stream.stage.{GraphStage, GraphStageLogic, OutHandler}
import akka.stream.{Attributes, Outlet, SourceShape}
import io.github.antivanov.learning.akka.project.stats.util.FileWalker

class FilesSource(directoryRoot: File) extends GraphStage[SourceShape[File]] {
  val out: Outlet[File] = Outlet("FilesSource")
  override val shape: SourceShape[File] = SourceShape(out)

  override def createLogic(inheritedAttributes: Attributes): GraphStageLogic = {
    new GraphStageLogic(shape) {
      val files = FileWalker.listFiles(directoryRoot)
      val fileIterator: Iterator[File] = files.iterator

      setHandler(out, new OutHandler {
        override def onPull(): Unit = {
          fileIterator.nextOption
            .fold(complete(out))(push(out, _))
        }
      })
    }
  }
}

object FilesSource {

  def fromDirectory(directoryRoot: File): Source[File, NotUsed] =
    Source.fromGraph(new FilesSource(directoryRoot))
}
