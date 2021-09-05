import $ivy.`com.lihaoyi::scalatags:0.9.1`
import $ivy.`com.atlassian.commonmark:commonmark:0.13.1`
import scalatags.Text.all._
import mill._
import os.{Path, Pipe, Shellable}
import java.time.{Instant, ZoneId}
import java.time.format.DateTimeFormatter

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

def pdfs = T {
  val destPath = dist().path
  val postHtmls = os.list(destPath / "post")
  val postPdfs = T.dest / "post"
  os.makeDir.all(postPdfs)
  postHtmls.foreach(from => {
    val to = postPdfs / from.last.replace(".html", ".pdf")
    println(s"ts-node ./html.to.pdf.ts '${from.toString()}' '${to.toString()}'")
    Command("ts-node ./html.to.pdf.ts", from.toString(), to.toString()).execute()
  })
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