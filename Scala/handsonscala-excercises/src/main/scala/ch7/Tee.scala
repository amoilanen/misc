package ch7

import os.{SubProcess, proc}

object Tee extends App {

  def pipe(first: proc, rest: proc*): SubProcess =
    rest.foldLeft(first.spawn())({ case (prev, cur) =>
      cur.spawn(stdin = prev.stdout)
    })

  implicit def autoSpawn(p: proc): SubProcess =
    p.spawn()

  implicit class SubProcessWithOps(p: SubProcess) {
    def |(other: proc): SubProcess =
      other.spawn(stdin = p.stdout)
  }

  implicit class ProcWithOps(p: proc) {
    def |(other: proc): SubProcess = {
      other.spawn(stdin = p.spawn().stdout)
    }
  }

  def command(): Unit = {
    val firstRun = pipe(
      os.proc( "curl", "https://api.github.com/repos/lihaoyi/mill/releases"),
      os.proc("base64"),
      os.proc("gzip"),
      os.proc("tee", "out.bz"),
      os.proc("curl", "-X", "PUT", "-d", "@-", "https://httpbin.org/anything")
    )

    println(firstRun.stdout.lines.filter(_.contains("Content-Length"))(0))

    val secondRun =
      os.proc( "curl", "https://api.github.com/repos/lihaoyi/mill/releases") |
      os.proc("base64") |
      os.proc("gzip") |
      os.proc("tee", "out.bz") |
      os.proc("curl", "-X", "PUT", "-d", "@-", "https://httpbin.org/anything")

    println(secondRun.stdout.lines.filter(_.contains("Content-Length"))(0))
  }

  command
}
