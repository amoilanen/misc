package ch11

import org.jsoup.nodes.Element
import org.jsoup.select.Elements

import scala.jdk.CollectionConverters._

object JSoupConversions {

  // Allows to select direct children of this element https://developer.mozilla.org/en-US/docs/Web/CSS/:scope
  private val ScopedDirectChildrenSelectorPrefix = ":scope >"

  private def toList(elements: Elements): List[Element] =
    elements.iterator.asScala.toList

  implicit class ElementOps(element: Element) {

    def querySelector(cssSelector: String): Option[Element] =
      querySelectorAll(cssSelector).headOption

    def querySelectorAll(cssSelector: String): List[Element] = {
      if (cssSelector.startsWith(ScopedDirectChildrenSelectorPrefix)) {
        val cssSelectorWithoutScope = cssSelector.substring(ScopedDirectChildrenSelectorPrefix.length)
        querySelectorAll(cssSelectorWithoutScope).filter(element.children().contains(_))
      } else
        toList(element.select(cssSelector))
    }
  }
}