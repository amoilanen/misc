package ch11

import org.jsoup.nodes.Element
import org.jsoup.select.Elements

import scala.jdk.CollectionConverters._

object JSoupConversions {

  private def toList(elements: Elements): List[Element] =
    elements.iterator.asScala.toList

  implicit class ElementOps(element: Element) {

    def querySelector(cssSelector: String): Option[Element] =
      querySelectorAll(cssSelector).headOption

    def querySelectorAll(cssSelector: String): List[Element] =
      toList(element.select(cssSelector))
  }
}