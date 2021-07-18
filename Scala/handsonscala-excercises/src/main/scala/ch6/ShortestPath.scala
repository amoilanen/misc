package ch6

import scala.annotation.tailrec

object ShortestPath {

  type Graph[T] = Map[T, Seq[(T, Int)]]

  trait TraversalStrategy {
    def updateQueue[T](queue: List[T], visited: Set[T], graph: Graph[T]): List[T] =
      if (queue.isEmpty)
        queue
      else {
        val current = queue.head
        val notVisitedChildren = graph(current).filter({
          case (child, _) => !visited(child)
        }).map(_._1).toList
        appendNotVisitedChildNodesToQueue(queue.drop(1), notVisitedChildren)
      }

    protected def appendNotVisitedChildNodesToQueue[T](queue: List[T], notVisitedChildren: List[T]): List[T]
  }

  object DepthFirstTraversalStrategy extends TraversalStrategy {
    final override def appendNotVisitedChildNodesToQueue[T](queue: List[T], notVisitedChildren: List[T]): List[T] =
      notVisitedChildren ++ queue
  }

  object BreadthFirstTraversalStrategy extends TraversalStrategy {
    final override def appendNotVisitedChildNodesToQueue[T](queue: List[T], notVisitedChildren: List[T]): List[T] =
      queue ++ notVisitedChildren
  }

  private case class TraversalState[T](
    queue: List[T],
    visited: Set[T],
    shortestLengths: Map[T, Int],
    shortestPaths: Map[T, List[T]]
  )

  @tailrec
  private def traverseNext[T](graph: Graph[T], state: TraversalState[T], traversalStrategy: TraversalStrategy): TraversalState[T] = {
    val TraversalState(queue, visited, shortestLengths, shortestPaths) = state
    if (queue.isEmpty)
      state
    else {
      val current = queue.head
      val currentPathLength = shortestLengths(current)
      val currentPath = shortestPaths(current)

      val updatedVisited = visited + current
      val updatedQueue = traversalStrategy.updateQueue(queue, visited, graph)

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

      traverseNext(graph, TraversalState(updatedQueue, updatedVisited, updatedShortestLengths, updatedShortestPaths), traversalStrategy)
    }
  }

  private def searchPaths[T](start: T, graph: Graph[T], traversalStrategy: TraversalStrategy): Map[T, List[T]] = {
    val queue = List(start)
    val visited = Set(start)
    val shortestLengths = Map(start -> 0)
    val shortestPaths = Map(start -> List(start))
    val traversalResult = traverseNext(graph, TraversalState(queue, visited, shortestLengths, shortestPaths), traversalStrategy)
    traversalResult.shortestPaths
  }

  def shortestPath[T](start: T, dest: T, graph: Graph[T], traversalStrategy: TraversalStrategy = DepthFirstTraversalStrategy): Seq[T] = {
    val shortestPaths = searchPaths(start, graph, traversalStrategy)
    shortestPaths(dest)
  }
}
