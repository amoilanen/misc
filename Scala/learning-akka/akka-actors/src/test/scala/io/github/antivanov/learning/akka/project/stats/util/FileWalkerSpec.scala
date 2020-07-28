package io.github.antivanov.learning.akka.project.stats.util

import io.github.antivanov.learning.akka.testutil.FileMocks
import org.scalamock.scalatest.MockFactory
import org.scalatest.matchers.should.Matchers
import org.scalatest.freespec.AnyFreeSpec

class FileWalkerSpec extends AnyFreeSpec with Matchers with FileMocks with MockFactory {

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
