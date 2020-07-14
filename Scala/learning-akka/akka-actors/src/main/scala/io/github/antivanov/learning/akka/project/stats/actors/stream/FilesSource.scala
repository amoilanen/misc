package io.github.antivanov.learning.akka.project.stats.actors.stream

import java.io.File

import akka.NotUsed
import akka.stream.scaladsl.Source
import akka.stream.{Attributes, Outlet, SourceShape}
import akka.stream.stage.{GraphStage, GraphStageLogic, OutHandler}
import io.github.antivanov.learning.akka.project.stats.actors.FileWalker

class FilesSource(directoryRoot: File) extends GraphStage[SourceShape[File]] {
  val out: Outlet[File] = Outlet("FilesSource")
  override val shape: SourceShape[File] = SourceShape(out)

  override def createLogic(inheritedAttributes: Attributes): GraphStageLogic =
    new GraphStageLogic(shape) {

      val files = FileWalker.listFiles(directoryRoot)
      val fileIterator: Iterator[File] = files.iterator

      setHandler(out, new OutHandler {
        override def onPull(): Unit = {
          if (fileIterator.hasNext) {
            push(out, fileIterator.next)
          } else {
            complete(out)
          }
        }
      })
    }
}

object FilesSource {

  def fromDirectory(directoryRoot: File): Source[File, NotUsed] =
    Source.fromGraph(new FilesSource(directoryRoot))
}
