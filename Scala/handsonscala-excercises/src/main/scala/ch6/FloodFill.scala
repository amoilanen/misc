package ch6

import java.awt.{Color, Image}
import java.awt.image.BufferedImage
import java.io.File

import javax.imageio.ImageIO

import scala.annotation.tailrec

object FloodFill extends App {

  type ColorComparator = (Color, Color) => Boolean

  case class Point(x: Int, y: Int)

  private def getColorAt(p: Point, image: BufferedImage): Color =
    new Color(image.getRGB(p.x, p.y))

  private def fillStartingAtPoint(point: Point, startingColor: Color, fillColor: Color, compareColors: ColorComparator, visitedPoints: Set[Point], image: BufferedImage): List[Point] = {
    val directions = List(
      (0 until point.x).reverse.map(x => Point(x, point.y)),
      (point.x + 1 until image.getWidth).map(x => Point(x, point.y)),
      (0 until point.y).reverse.map(y => Point(point.x, y)),
      (point.y + 1 until image.getHeight).map(y => Point(point.x, y))
    )
    val pointsToFill = directions.map(
      _.takeWhile(p => compareColors(startingColor, getColorAt(p, image)))
    ).flatten
    pointsToFill.foreach(p =>
      if (!visitedPoints.contains(p)) {
        image.setRGB(p.x, p.y, fillColor.getRGB)
      }
    )
    pointsToFill
  }

  @tailrec
  private def floodFillPoints(points: Set[Point], visitedPoints: Set[Point], startingColor: Color, fillColor: Color, compareColors: ColorComparator, image: BufferedImage): List[Point] = {
    val pointsToVisit = points.diff(visitedPoints)
    if (pointsToVisit.isEmpty) {
      List()
    } else {
      val nextPointsToVisit = pointsToVisit.map(p =>
        fillStartingAtPoint(p, startingColor, fillColor, compareColors, visitedPoints, image)
      ).flatten
      val nextVisitedPoints = visitedPoints ++ pointsToVisit
      floodFillPoints(nextPointsToVisit, nextVisitedPoints, startingColor, fillColor, compareColors, image)
    }
  }

  def floodFill(src: String, dest: String, start: Point, compareColors: ColorComparator, fillColor: Color): Unit = {
    val srcImage = imageFromResource(src)
    val pointColor = getColorAt(start, srcImage)
    floodFillPoints(Set(start), Set(), pointColor, fillColor, compareColors, srcImage)
    val outputFile = new File(s"./src/main/resources/$dest")
    ImageIO.write(srcImage, "jpg", outputFile)
  }

  def imageFromResource(resourceName: String): BufferedImage =
    ImageIO.read(new File(getClass.getResource(s"/$resourceName").getPath))

  floodFill(
    src = "Raw.jpg", dest = "Filled.jpg", start = Point(180, 90),
    compareColors = { (a: java.awt.Color, b: java.awt.Color) =>
      def sqrDiff(f: java.awt.Color => Int) = math.pow(f(a) - f(b), 2)
      math.sqrt(sqrDiff(_.getBlue) + sqrDiff(_.getGreen) + sqrDiff(_.getRed)) < 25
    },
    fillColor = java.awt.Color.BLACK
  )
}
