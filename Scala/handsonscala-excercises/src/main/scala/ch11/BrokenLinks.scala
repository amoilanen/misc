package ch11

import java.net.{URI, URL}

import org.jsoup.Jsoup
import org.jsoup.nodes.Document

import scala.annotation.tailrec
import scala.util.Try

object Logger {
  def debug(msg: String): Unit = {
    println(msg)
  }
}

object BrokenLinks extends App {
  import JSoupConversions._

  case class ScrapedLinks(internal: Set[URI], external: Set[URI])
  case class CheckedLink(link: URI, working: Boolean)

  def scrapeLinksFrom(url: URI): List[URI] =
    Try {
      val document: Document = Jsoup.connect(url.toString).get
      val baseUri = document.querySelector("base").map(element =>
        new URI(element.attr("href"))).getOrElse(url)
      document.querySelectorAll("a").map(element => {
        val uri = new URI(element.attr("href"))
        val fullUri = if (!uri.isAbsolute) {
          new URL(baseUri.toURL, uri.toString).toURI
        } else uri
        fullUri.normalize()
      })
    }.toOption.toList.flatten

  def getAllLinks(startingPage: URI): ScrapedLinks = {
    val startingPageHost = startingPage.getHost

    def filterHomePageLinks(links: List[URI]): List[URI] =
      links.filter(link => link.getHost == startingPageHost)

    @tailrec
    def collectLinks(foundLinks: Set[URI], alreadyVisited: Set[URI], toBeTraversed: List[URI]): Set[URI] = {
      val toBeTraversedNotVisited = toBeTraversed.filter(!alreadyVisited.contains(_))
      toBeTraversedNotVisited match {
        case Nil => foundLinks
        case linkToTraverse::restOfLinksToTraverse =>
          Logger.debug(s"Traversing $linkToTraverse, visited ${alreadyVisited.size}, to visit ${toBeTraversed.size}")
          val links = scrapeLinksFrom(linkToTraverse)
          val homePageLinks = filterHomePageLinks(links)
          collectLinks(foundLinks ++ links, alreadyVisited + linkToTraverse, restOfLinksToTraverse ++ homePageLinks)
      }
    }

    val allLinks = collectLinks(Set(), Set(), List(startingPage))
    val linksByType = allLinks.groupBy(_.getHost == startingPageHost)
    ScrapedLinks(linksByType.get(true).toSet.flatten, linksByType.get(false).toSet.flatten)
  }

  def checkLinks(links: Set[URI]): Set[CheckedLink] = {
    links.map({ case link =>
      val isActive = Try(link.toURL.openConnection()).toEither.isRight
      CheckedLink(link, isActive)
    })
  }

  def brokenLinks(links: Set[URI]): Set[URI] = {
    val checkedLinks = checkLinks(links)
    checkedLinks.filter(!_.working).map(_.link)
  }

  val homePageUrl = new URI("https://www.lihaoyi.com")
  val scrapedLinks = getAllLinks(homePageUrl)
  Logger.debug(s"Found in total ${scrapedLinks.internal.size} ${scrapedLinks.external.size}")

  println(s"Broken internal links ${brokenLinks(scrapedLinks.internal).toList}")
  println(s"Broken external links ${brokenLinks(scrapedLinks.external).toList}")
}
