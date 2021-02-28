package ch3

import java.io.{BufferedReader, BufferedWriter, Reader, Writer}

import org.scalamock.scalatest.MockFactory
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers

class FileReaderWriterSpec extends AnyFreeSpec with Matchers with MockFactory {

  import FileReaderWriterSpec._

  class MockableBufferedReader extends BufferedReader(mock[Reader], defaultBufferSize)
  class MockableBufferedWriter extends BufferedWriter(mock[Writer], defaultBufferSize)

  def mockFileReaderWriter(createReader: Option[String => BufferedReader] = None, createWriter: Option[String => BufferedWriter] = None): FileReaderWriter = {
    new FileReaderWriter() {
      override protected def fileWriter(filePath: String): BufferedWriter =
        createWriter.getOrElse(super.fileWriter _)(filePath)

      override protected def fileReader(filePath: String): BufferedReader =
        createReader.getOrElse(super.fileReader _)(filePath)
    }
  }

  "withFileWriter" - {

    "opens a writer successfully and write contents to writer, closes writer" in {
      val writer = mock[MockableBufferedWriter]
      (writer.write: String => Unit).expects(expectedLine).returns(()).once()
      (writer.close _).expects().returns(()).once()
      val readerWriter = mockFileReaderWriter(createWriter = Some(path => {
        path shouldEqual filePath
        writer
      }))

      readerWriter.withFileWriter(filePath)(writer =>
        writer.write(expectedLine)
      )
    }

    "when block of code throws an exception, should still close writer" in {
      val writer = mock[MockableBufferedWriter]
      (writer.write: String => Unit).expects(expectedLine).returns(()).never()
      (writer.close _).expects().returns(()).once()
      val readerWriter = mockFileReaderWriter(createWriter = Some(path => {
        path shouldEqual filePath
        writer
      }))

      val actualError = intercept[Throwable] {
        readerWriter.withFileWriter(filePath)(_ =>
          throw blockError
        )
      }
      actualError shouldEqual blockError
    }
  }

  "withFileReader" - {

    "opens a reader successfully and reads contents through reader, closes reader" in {
      val reader = mock[MockableBufferedReader]
      (reader.readLine _).expects().returns(expectedLine).once()
      (reader.close _).expects().returns(()).once()
      val readerWriter = mockFileReaderWriter(createReader = Some(path => {
        path shouldEqual filePath
        reader
      }))

      readerWriter.withFileReader(filePath)(reader =>
        reader.readLine() shouldEqual expectedLine
      )
    }

    "when block of code throws an exception, should still close reader" in {
      val reader = mock[MockableBufferedReader]
      (reader.readLine _).expects().returns(expectedLine).never()
      (reader.close _).expects().returns(()).once()
      val readerWriter = mockFileReaderWriter(createReader = Some(path => {
        path shouldEqual filePath
        reader
      }))

      val actualError = intercept[Throwable] {
        readerWriter.withFileReader(filePath)(_ =>
          throw blockError
        )
      }
      actualError shouldEqual blockError
    }
  }
}

object FileReaderWriterSpec {

  val defaultBufferSize = 1
  val filePath = "some_file_path"
  val expectedLine = "expected_line"
  val blockError = new RuntimeException("Exception in the block")
}
