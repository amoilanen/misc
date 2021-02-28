package ch3

import java.io.{BufferedReader, BufferedWriter, Closeable, File, FileReader, FileWriter, Reader, Writer}

import scala.jdk.CollectionConverters._

class FileReaderWriter {

  protected def fileWriter(filePath: String): BufferedWriter = {
    val file = new File(filePath)
    if (!file.exists()) {
      file.createNewFile()
    }
    new BufferedWriter(new FileWriter(filePath))
  }

  protected def fileReader(filePath: String): BufferedReader =
    new BufferedReader(new FileReader(filePath))

  private def autoClose[T <: Closeable](open: () => T)(block: T => Unit): Unit = {
    var closeable: Option[T] = None
    try {
      closeable = Some(open())
      closeable.foreach(block(_))
    } finally {
      closeable.map(_.close())
    }
  }

  def withFileWriter(filePath: String)(block: BufferedWriter => Unit): Unit =
    autoClose(() => fileWriter(filePath))(block)

  def withFileReader(filePath: String)(block: BufferedReader => Unit): Unit =
    autoClose(() => fileReader(filePath))(block)
}

object FileReaderWriter extends App {

  val utilities = new FileReaderWriter()
  import utilities._

  val filePath = "./test.file.txt"

  withFileWriter(filePath) { writer =>
    writer.write("Test content")
  }

  withFileReader(filePath) { reader =>
    val contents: String = reader.lines().iterator().asScala.toList.mkString("\n")
    print(contents)
  }
}
