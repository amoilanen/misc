package io.github.antivanov.learning.akka.testutil

import java.io.File

import org.scalamock.scalatest.MockFactory

trait FileMocks { self: MockFactory=>

  class MockFile extends File("")

  def dir(name: String, files: File*): File = {
    val directory = mock[MockFile]
    (directory.getName _).expects().returning(name).anyNumberOfTimes()
    (directory.listFiles: () => Array[File]).expects().returning(files.toArray).anyNumberOfTimes()
    (directory.isDirectory _).expects().returning(true).anyNumberOfTimes()
    directory
  }

  def file(path: String): File = {
    val name = path.substring(path.lastIndexOf("/") + 1)
    val file = mock[MockFile]
    (file.equals _).expects(*).onCall({ other: Any =>
      other match {
        case otherFile: File => otherFile.getPath == path
        case _ => false
      }
    }).anyNumberOfTimes()
    (file.getName _).expects().returning(name).anyNumberOfTimes()
    (file.getPath _).expects().returning(path).anyNumberOfTimes()
    (file.getAbsolutePath _).expects().returning(path).anyNumberOfTimes()
    (file.isDirectory _).expects().returning(false).anyNumberOfTimes()
    file
  }
}
