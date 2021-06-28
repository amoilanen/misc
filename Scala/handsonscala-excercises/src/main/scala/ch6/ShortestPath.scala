package ch6

import scala.annotation.tailrec

object ShortestPath {

  private case class TraversalState[T](
    queue: List[T],
    visited: Set[T],
    shortestLengths: Map[T, Int],
    shortestPaths: Map[T, List[T]]
  )

  @tailrec
  private def traverseNext[T](graph: Map[T, Seq[(T, Int)]], state: TraversalState[T]): TraversalState[T] = {
    val TraversalState(queue, visited, shortestLengths, shortestPaths) = state
    if (queue.isEmpty)
      state
    else {
      val current = queue.last
      val currentPathLength = shortestLengths(current)
      val currentPath = shortestPaths(current)

      val updatedVisited = visited + current

      val notVisitedChildren = graph(current).filter({
        case (child, _) => !visited(child)
      }).map(_._1).toList
      val updatedQueue = queue.dropRight(1) ++ notVisitedChildren

      val (updatedShortestLengths, updatedShortestPaths) = graph(current).foldLeft((shortestLengths, shortestPaths))({ case (acc, (child, edgeLength)) =>
        val (shortestLengths, shortestPaths) = acc
        val foundShorterPath = !shortestLengths.get(child).exists(_ <= currentPathLength + edgeLength)
        val updatedShortestLengths = if (foundShorterPath)
          shortestLengths + (child -> (currentPathLength + edgeLength))
        else
          shortestLengths
        val updatedShortestPaths = if (foundShorterPath)
          shortestPaths + (child -> (currentPath ++ List(child)))
        else
          shortestPaths
        (updatedShortestLengths, updatedShortestPaths)
      })

      traverseNext(graph, TraversalState(updatedQueue, updatedVisited, updatedShortestLengths, updatedShortestPaths))
    }
  }

  def depthSearchPaths[T](start: T, graph: Map[T, Seq[(T, Int)]]): Map[T, List[T]] = {
    val shortestLengths = Map(start -> 0)
    val shortestPaths = Map(start -> List(start))
    val visited = Set(start)
    val queue = List(start)
    val traversalResult = traverseNext(graph, TraversalState(queue, visited, shortestLengths, shortestPaths))
    traversalResult.shortestPaths
  }

  def shortestPath[T](start: T, dest: T, graph: Map[T, Seq[(T, Int)]]): Seq[T] = {
    val shortestPaths = depthSearchPaths(start, graph)
    shortestPaths(dest)
  }
}
