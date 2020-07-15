package io.github.antivanov.learning.akka.project.stats.util

case class LineCounts(counts: Map[FileExtension, Long]) {

  val report: String = {
    val extensionStats = counts.toList.sortBy({
      case (_, lineCount) => lineCount
    }).reverse.map({
      case (fileExtension, lineCounts) =>
        f"${fileExtension.value}: ${lineCounts}"
    }).mkString("\n")

    extensionStats
  }
}
