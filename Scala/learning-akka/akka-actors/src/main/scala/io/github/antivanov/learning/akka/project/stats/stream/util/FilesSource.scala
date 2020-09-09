package io.github.antivanov.learning.akka.project.stats.stream.util

import java.io.File

import akka.NotUsed
import akka.stream.scaladsl.Source
import akka.stream.stage.{GraphStage, GraphStageLogic, OutHandler}
import akka.stream.{Attributes, Outlet, SourceShape}
import io.github.antivanov.learning.akka.project.stats.util.{FileWalker, FileWalkerLike}

import scala.util.Try
import scala.util.control.NonFatal

class FilesSource(directoryRoot: File, fileWalker: FileWalkerLike = FileWalker) extends GraphStage[SourceShape[File]] {
  val out: Outlet[File] = Outlet("FilesSource")
  override val shape: SourceShape[File] = SourceShape(out)

  override def createLogic(inheritedAttributes: Attributes): GraphStageLogic = {
    new GraphStageLogic(shape) {
      Try(fileWalker.listFiles(directoryRoot)).collect({ files =>
        val fileIterator: Iterator[File] = files.iterator
        setHandler(out, new OutHandler {
          override def onPull(): Unit = {
            val nextFile = fileIterator.nextOption
            nextFile.fold(complete(out))(push(out, _))
          }
        })
      }).recover({
        case NonFatal(e) =>
          setHandler(out, new OutHandler {
            override def onPull(): Unit = {
              fail(out, e)
              complete(out)
            }
          })
      })
    }
  }
}

object FilesSource {

  def fromDirectory(directoryRoot: File): Source[File, NotUsed] =
    Source.fromGraph(new FilesSource(directoryRoot))
}
