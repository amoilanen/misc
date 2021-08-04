package ch7

import os.Path

object FileSyncDelete extends App {

  private def syncSinglePath(src: Path, dest: Path): Unit = {
    if (!os.exists(src))
      os.remove.all(dest)
    else {
      val srcAndDestAreNotDirectories = List(src, dest).forall(!os.isDir(_))
      if (srcAndDestAreNotDirectories)
        if (!os.exists(dest)
          || !os.read.bytes(src).sameElements(os.read.bytes(dest)))
          os.copy.over(src, dest, createFolders = true)
        else
          ()
      else
        os.copy.over(src, dest, createFolders = true)
    }
  }

  def sync(src: os.Path, dest: os.Path): Unit = {
    val relativeSubpaths = os.walk(src).toList.map(_.subRelativeTo(src))
    val relativeDestSubpaths = os.walk(dest).toList.map(_.subRelativeTo(dest))
    val uniqueSubPaths = List(relativeSubpaths, relativeDestSubpaths).flatten.toSet

    for (subPath <- uniqueSubPaths) {
      val srcSubPath = src / subPath
      val destSubPath = dest / subPath
      syncSinglePath(srcSubPath, destSubPath)
    }
  }

  def test(filesDirectory: Path): Unit = {
    println("INITIALIZING SRC AND DEST")

    val src = filesDirectory / "src"
    os.makeDir.all(src)
    val dest = filesDirectory / "dest"
    os.makeDir.all(dest)

    os.write(src / "folder1" / "hello.txt", "HELLO", createFolders = true)
    os.write(src / "folder1" / "nested" / "world.txt", "world", createFolders = true)
    os.write(dest / "folder1" / "nested" / "todelete.txt", "DELETE", createFolders = true)
    os.write(dest / "folder2" / "todelete2.txt", "DELETE2", createFolders = true)

    println("FIRST SYNC")
    sync(src, dest)

    println("FIRST VALIDATION")
    assert(os.read(dest / "folder1" / "hello.txt") == "HELLO")
    assert(os.read(dest /  "folder1" / "nested" / "world.txt") == "world")
    assert(!os.exists(dest / "folder1" / "nested" / "todelete.txt"))
    assert(!os.exists(dest / "folder2" / "todelete2.txt"))

    println("UPDATE SRC")

    os.write.over(src / "folder1" / "hello.txt", "hello")
    os.write.over(src / "folder1" / "nested" / "world.txt", "WORLD")

    println("SECOND SYNC")
    sync(src, dest)

    println("SECOND VALIDATION")
    assert(os.read(dest / "folder1" / "hello.txt") == "hello")
    assert(os.read(dest /  "folder1" / "nested" / "world.txt") == "WORLD")

    os.remove.all(filesDirectory)
  }

  val filesDirectory = os.pwd / "out"
  try {
    os.remove.all(filesDirectory)
    test(filesDirectory)
  } finally {
    os.remove.all(filesDirectory)
  }
}
