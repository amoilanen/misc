package ch9.post

import java.io.File
import java.time.{Instant, ZoneId}
import java.time.format.DateTimeFormatter

import os.Path
import scalatags.Text.all._

object Blog extends App {

  val LastModifiedDateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    .withZone(ZoneId.systemDefault())

  def lastModified(file: File): String = {
    val lastModified = Instant.ofEpochMilli(file.lastModified())
    LastModifiedDateFormat.format(lastModified)
  }

  val targetGitRepo = ""
  val rootDir = os.pwd / "src" / "main" / "scala" / "ch9"
  val postInfo = os
    .list(rootDir / "post")
    .map { p: Path =>
      val s"$prefix - $suffix.md" = p.last
      (prefix, suffix, p)
    }
    .sortBy(_._1.toInt)

  def mdNameToHtml(name: String) = name.replace(" ", "-").toLowerCase + ".html"

  val bootstrapCss = link(
    rel := "stylesheet",
    href := "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.css"
  )

  os.remove.all(rootDir / "out")
  os.makeDir.all(rootDir / "out" / "post")

  for ((_, suffix, path) <- postInfo) {
    val parser = org.commonmark.parser.Parser.builder().build()
    val document = parser.parse(os.read(path))
    val renderer = org.commonmark.renderer.html.HtmlRenderer.builder().build()
    val output = renderer.render(document)
    os.write(
      rootDir / "out" / "post" / mdNameToHtml(suffix),
      doctype("html")(
        html(
          head(bootstrapCss),
          body(
            h1(a("Blog", href := "../index.html"), " / ", suffix),
            raw(output),
            span(s"Written On ${lastModified(path.toIO)}")
          )
        )
      )
    )
  }

  os.write(
    rootDir / "out" / "index.html",
    doctype("html")(
      html(
        head(bootstrapCss),
        body(
          h1("Blog"),
          for ((_, suffix, path) <- postInfo)
            yield div(
              h2(a(href := ("post/" + mdNameToHtml(suffix)))(suffix)),
              span(s"Written On ${lastModified(path.toIO)}")
            )
        )
      )
    )
  )

  if (targetGitRepo != "") {
    os.proc("git", "init").call(cwd = rootDir / "out")
    os.proc("git", "add", "-A").call(cwd = rootDir / "out")
    os.proc("git", "commit", "-am", ".").call(cwd = rootDir / "out")
    os.proc("git", "push", targetGitRepo, "head", "-f").call(cwd = rootDir / "out")
  }
}
