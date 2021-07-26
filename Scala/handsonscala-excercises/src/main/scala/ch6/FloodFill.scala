package ch6

import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File

import javax.imageio.ImageIO

object FloodFill extends App {

  type ColorComparator = (Color, Color) => Boolean

  def floodFill(src: String, dest: String, startX: Int, startY: Int, compareColors: ColorComparator, fillColor: Color): Unit = {
    val srcImage = imageFromResource(src)
    val pointColor =  new Color(srcImage.getRGB(startX, startY))

    //TODO: Iterate over all the neighboring points with similar color, stop at dissimilar color
    (0 until startY).foreach(y => {
      val x = startX
      val neighborPointColor = new Color(srcImage.getRGB(x, y))
      if (compareColors(neighborPointColor, pointColor)) {
        srcImage.setRGB(x, y, fillColor.getRGB)
      }
    })
    val outputFile = new File(s"./src/main/resources/$dest")
    ImageIO.write(srcImage, "jpg", outputFile)
  }

  def imageFromResource(resourceName: String): BufferedImage =
    ImageIO.read(new File(getClass.getResource(s"/$resourceName").getPath))

  floodFill(
    src = "Raw.jpg", dest = "Filled.jpg", startX = 180, startY = 90,
    compareColors = { (a: java.awt.Color, b: java.awt.Color) =>
      def sqrDiff(f: java.awt.Color => Int) = math.pow(f(a) - f(b), 2)
      math.sqrt(sqrDiff(_.getBlue) + sqrDiff(_.getGreen) + sqrDiff(_.getRed)) < 25
    },
    fillColor = java.awt.Color.BLACK
  )
}
