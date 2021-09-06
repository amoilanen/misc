import java.io.{BufferedInputStream, BufferedOutputStream, BufferedWriter, FileInputStream, FileOutputStream}

import $ivy.`com.lihaoyi::scalatags:0.9.1`
import $ivy.`com.atlassian.commonmark:commonmark:0.13.1`
import $ivy.`org.apache.pdfbox:pdfbox:2.0.18`
import scalatags.Text.all._
import mill._
import os.{Path, Pipe, Shellable}
import java.time.Instant

import org.apache.pdfbox.multipdf.PDFMergerUtility
import java.time.format.DateTimeFormatter

import scala.util.Try

def currentTimeStampLabel(): String =
  DateTimeFormatter.ISO_INSTANT.format(Instant.now())

case class Command(command: String, notSplittableArgs: String*) {
  def execute(directory: Path = os.pwd): Unit = {
    val commandParts = command.split(" +").toSeq ++ notSplittableArgs
    val shellables = commandParts.map(part => Shellable(Seq(part)))
    os.proc(shellables: _*).call(cwd = directory, stderr = Pipe)
  }
}

case class Script(commands: Command*) {
  def execute(directory: Path = os.pwd): Unit = {
    commands.foreach(_.execute(directory))
  }
}

def mdNameToHtml(name: String): String = name.replace(" ", "-").toLowerCase + ".html"

case class PostDescription(prefix: String, title: String, path: os.Path)

val postDescriptions =
  os.list(os.pwd / "post")
    .map { (path: Path) =>
      val s"$prefix - $title.md" = path.last
      PostDescription(prefix, title, path)
    }
    .sortBy(_.prefix.toInt)

def bootstrap = T{
  os.write(
    T.dest / "bootstrap.css",
    requests.get("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.css")
      .text()
  )
  PathRef(T.dest / "bootstrap.css")
}

def renderMarkdown(s: String) = {
  val parser = org.commonmark.parser.Parser.builder().build()
  val document = parser.parse(s)
  val renderer = org.commonmark.renderer.html.HtmlRenderer.builder().build()
  renderer.render(document)
}
def renderHtmlPage(dest: os.Path, bootstrapUrl: String, contents: Frag*) = {
  os.write(
    dest,
    doctype("html")(
      html(head(link(rel := "stylesheet", href := bootstrapUrl)), body(contents))
    )
  )
  PathRef(dest)
}

object post extends Cross[PostModule](postDescriptions.map(_.prefix):_*)
class PostModule(postPrefix: String) extends Module{
  val PostDescription(_, suffix, postPath) = postDescriptions.find(_.prefix == postPrefix).get
  def source = T.source(postPath)
  def preview = T{
    renderMarkdown(os.read.lines(source().path).takeWhile(_.nonEmpty).mkString("\n"))
  }
  def render = T{
    renderHtmlPage(
      T.dest / mdNameToHtml(suffix),
      "../bootstrap.css",
      h1(a(href := "../index.html")("Blog"), " / ", suffix),
      raw(renderMarkdown(os.read(source().path)))
    )
  }
}

def postTitles = T.input{ postDescriptions.map(_.title) }
val posts = T.sequence(postDescriptions.map(p => post(p.prefix).render))
val previews = T.sequence(postDescriptions.map(p => post(p.prefix).preview))

def index = T {
  renderHtmlPage(
    T.dest / "index.html",
    "bootstrap.css",
    h1("Blog"),
    for ((suffix, preview) <- postTitles().zip(previews()))
      yield frag(
        h2(a(href := ("post/" + mdNameToHtml(suffix)))(suffix)),
        raw(preview) // include markdown-generated HTML "raw" without HTML-escaping it
      )
  )
}

def clean = T {
  dist().path.toIO.delete()
}

def dist = T {
  for (post <- posts()) {
    os.copy(post.path, T.dest / "post" / post.path.last, createFolders = true)
  }
  os.copy(index().path, T.dest / "index.html")
  os.copy(bootstrap().path, T.dest / "bootstrap.css")
  PathRef(T.dest)
}

def mergePdfs(output: Path, inputs: Path*): Unit = {
  val inputStreams = inputs.map(input => Try(new BufferedInputStream(new FileInputStream(input.toIO))).toOption).flatten
  val outputStream = Try(new BufferedOutputStream(new FileOutputStream(output.toIO))).toOption
  val successfullyOpenStreams = inputStreams ++ outputStream

  try {
    if (successfullyOpenStreams.length == inputs.length + 1) {
      val mergerUtility = new PDFMergerUtility()
      mergerUtility.setDestinationStream(outputStream.get)
      inputStreams.foreach(mergerUtility.addSource(_))
      mergerUtility.mergeDocuments(null)
    } else {
      throw new RuntimeException(s"Could not open all the streams... ${output}, ${inputs}")
    }
  } finally {
    successfullyOpenStreams.foreach(_.close())
  }
}

def pdfs = T {
  val destPath = dist().path
  val postHtmls = os.list(destPath / "post")
  val postPdfsDirectory = T.dest / "post"
  os.makeDir.all(postPdfsDirectory)
  val postPdfs = postHtmls.map(from =>
    postPdfsDirectory / from.last.replace(".html", ".pdf")
  )
  postHtmls.zip(postPdfs).foreach({ case (from, to) =>
    Command("ts-node ./html.to.pdf.ts", from.toString(), to.toString()).execute()
  })

  val mergedPdfs = T.dest / "post" / "all-posts.pdf"
  mergePdfs(mergedPdfs, postPdfs:_*)

  PathRef(T.dest)
}

// mill main git@bitbucket.org:ant-ivanov/temp-repo.git
def main(gitUserAndRepo: String) = T.command {
  val commitMessage = s"new blog version at $currentTimeStampLabel"
  val builtDist = dist().path

  Script(
    Command("git init"),
    Command("git remote add deploy", gitUserAndRepo),
    Command("git add *"),
    Command("git commit -m", commitMessage),
    Command("git push -f deploy master:main")
  ).execute(directory = builtDist)
}