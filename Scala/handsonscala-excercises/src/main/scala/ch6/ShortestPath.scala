package ch6

object ShortestPath {

  def depthSearchPaths[T](start: T, graph: Map[T, Seq[(T, Int)]]): Map[T, List[T]] = {
    val shortestLengths = collection.mutable.Map(start -> 0)
    val shortestPathes = collection.mutable.Map(start -> List(start))
    val visited = collection.mutable.Set(start)
    val queue = collection.mutable.ArrayDeque(start)
    while (queue.nonEmpty) {
      val current = queue.removeLast()
      val currentPathLength = shortestLengths(current)
      val currentPath = shortestPathes(current)
      graph(current).foreach({ case (child, edgeLength) =>
        if (!shortestLengths.get(child).exists(_ <= currentPathLength + edgeLength)) {
          shortestLengths(child) = currentPathLength + edgeLength
          shortestPathes(child) = currentPath ++ List(child)
        }
        if (!visited(child)) {
          queue.append(child)
        }
        visited.add(current)
      })
    }
    shortestPathes.toMap
  }

  def shortestPath[T](start: T, dest: T, graph: Map[T, Seq[(T, Int)]]): Seq[T] = {
    val shortestPathes = depthSearchPaths(start, graph)
    shortestPathes(dest)
  }
}
