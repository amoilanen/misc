package ch11

import ch3.FileReaderWriter
import java.net.URL

import ujson.Value
import upickle.default
import org.jsoup.Jsoup
import org.jsoup.nodes.{Document, Element}

final class WebApiAnnotation(val name: String) {
  override def toString: String = name
}
object WebApiAnnotation {
  val Deprecated = new WebApiAnnotation("deprecated")
  val Experimental = new WebApiAnnotation("experimental")
}

case class WebApi(name: String, link: URL, annotations: List[WebApiAnnotation])

object ReadWrites {

  implicit val webApiAnnotationReadWriter: default.ReadWriter[WebApiAnnotation] = upickle.default.readwriter[ujson.Value].bimap[WebApiAnnotation](
    (apiAnnotation: WebApiAnnotation) => ujson.Str(apiAnnotation.name),
    (value: Value) => new WebApiAnnotation(value.str)
  )

  implicit val urlReadWriter: default.ReadWriter[URL] = upickle.default.readwriter[ujson.Value].bimap[URL](
    (url: URL) => ujson.Str(url.toString),
    (value: Value) => new URL(value.str)
  )

  implicit val webApiReadWriter: default.ReadWriter[WebApi] = upickle.default.macroRW[WebApi]
}

object ApiStatus extends App {
  import ReadWrites._
  import JSoupConversions._
  val utilities = new FileReaderWriter()
  import utilities._

  def scrapeWebApiDescriptions(): List[WebApi] = {
    val rootHost = "https://developer.mozilla.org/"
    val webApisRoot: Document = Jsoup.connect(s"$rootHost/en-US/docs/Web/API").get
    val webApiSpecs = webApisRoot.querySelectorAll("#specifications + div li")

    webApiSpecs.map((webApiSpec: Element) => {
      val a = webApiSpec.querySelector("a").get
      val href = a.attr("href")
      val fullLink = s"$rootHost/$href"
      val webApiName = a.text()
      val isDeprecated = webApiSpec.querySelectorAll(".icon-deprecated").length > 0
      val isExperimental = webApiSpec.querySelectorAll(".icon-experimental").length > 0
      val deprecatedAnnotation = if (isDeprecated) Some(WebApiAnnotation.Deprecated) else None
      val experimentalAnnotation = if (isExperimental) Some(WebApiAnnotation.Experimental) else None
      val annotations = deprecatedAnnotation.toList ++ experimentalAnnotation.toList
      WebApi(webApiName, new URL(fullLink), annotations)
    })
  }

  val webApis = scrapeWebApiDescriptions()
  val json = upickle.default.write(webApis)

  withFileWriter("webapis.json") { writer =>
    writer.write(json)
  }
}