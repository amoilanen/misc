package io.github.antivanov.learning.akka.project.stats.util

import java.io.File

import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpec
import org.scalamock.scalatest.MockFactory

class FileWalkerSpec extends AnyFreeSpec with Matchers with MockFactory {

  class MockFile extends File("")

  def dir(name: String, files: File*): File = {
    val directory = mock[MockFile]
    (directory.getName _).expects().returning(name).anyNumberOfTimes()
    (directory.listFiles: () => Array[File]).expects().returning(files.toArray).anyNumberOfTimes()
    (directory.isDirectory _).expects().returning(true).anyNumberOfTimes()
    directory
  }

  def file(absolutePath: String): File = {
    val name = absolutePath.substring(absolutePath.lastIndexOf("/") + 1)
    val file = mock[MockFile]
    (file.getName _).expects().returning(name).anyNumberOfTimes()
    (file.getAbsolutePath _).expects().returning(absolutePath).anyNumberOfTimes()
    (file.isDirectory _).expects().returning(false).anyNumberOfTimes()
    file
  }

  "listFiles" - {

    "should list no files in an empty directory" in {
      val root = dir("empty")
      FileWalker.listFiles(root).map(_.getAbsolutePath) shouldEqual List()
    }

    "should list a file which is not a directory" in {
      val root = file("1.txt")
      FileWalker.listFiles(root).map(_.getAbsolutePath) shouldEqual List("1.txt")
    }

    "should list all files recursively" in {
      val root = dir("1",
        dir("2",
          dir("3",
            file("1/2/3/4.txt"),
            file("1/2/3/5.txt")
          ),
          file("1/2/6.txt")
        ),
        file("1/7.txt"),
        file("1/8.txt")
      )
      FileWalker.listFiles(root).map(_.getAbsolutePath) shouldEqual List(
        "1/2/3/4.txt",
        "1/2/3/5.txt",
        "1/2/6.txt",
        "1/7.txt",
        "1/8.txt"
      )
    }

    "should exclude .git files" in {
      val root = dir("1",
        dir(".git",
          file(".git/1.txt")
        ),
        file("1/2.txt"),
        file("1/3.txt")
      )
      FileWalker.listFiles(root).map(_.getAbsolutePath) shouldEqual List(
        "1/2.txt",
        "1/3.txt"
      )
    }
  }
}
