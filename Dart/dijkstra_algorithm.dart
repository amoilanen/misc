library Graphs;

class Graph {
  num nodesNumber;
  List<List<num>> edges;
  
  Graph(num nodesNumber, List<List<num>> edges) {
      this.nodesNumber = nodesNumber;
      initEdges(edges);
  }

  void initEdges(List<List<num>> edges) {
      this.edges = new List<List<num>>();
      for (int i = 0; i < nodesNumber; i++) {
          List<num> row = new List<num>();

          for (int j = 0; j < nodesNumber; j++) {            
              row.add(null);
          }
          this.edges.add(row);
      }
      if (!edges.isEmpty) {
          edges.forEach((e) {
              edge(e[0], e[1], e[2]);
          });
      }
  }
  
  void edge(num from, num to, num weight) {
      edges[from - 1][to - 1] = weight;
  }
 
  Map _constructShortestPath(List<num> distances, List<num> previous, List<num> unvisited, num to) {
      num vertex = to;
      List<num> path = new List<num>();

      while (null != vertex) {
          path.add(vertex + 1);
          vertex = previous[vertex];
      };
      
      return {
         'path': path,
         'length': distances[to]
      };
  }
  
  num _getUnvisitedVertexWithShortestPath(List<num> distances, List<num> previous, List<num> unvisited) {
    num minimumDistance = 1/0;
    num vertex = null;
      
    unvisited.forEach((unvisitedVertex) {
      if (distances[unvisitedVertex] < minimumDistance) {
        vertex = unvisitedVertex;
        minimumDistance = distances[vertex];
      };
    });
    return vertex;
  }
  
  void _updateDistancesForCurrent(List<num> distances, List<num> previous, List<num> unvisited, num current) {  
    for (num i = 0; i < edges[current].length; i++) {
      num currentEdge = edges[current][i];
      
      if ((null != currentEdge) && unvisited.contains(i)) {
        if (distances[current] + currentEdge < distances[i]) {
          distances[i] = distances[current] + currentEdge;
          previous[i] = current;
        };
      };
    };
  }
  
  //Dijkstra algorithm http://en.wikipedia.org/wiki/Dijkstra's_algorithm
  Map getShortestPath(num from, num to) {  
      List<num> unvisited = new List<num>();
      num current = null;
      List<num> distances = new List<num>();
      List<num> previous = new List<num>();

      from = from - 1;    
      to = to - 1;
      //Initialization
      for (num i = 0; i < nodesNumber; i++) {
          unvisited.add(i);
          //Infinity
          distances.add(1/0);
          previous.add(null);
      };
      distances[from] = 0;
    
      while (true) {
          if (!unvisited.contains(to)) {
              return _constructShortestPath(distances, previous, unvisited, to);
          };
          current = _getUnvisitedVertexWithShortestPath(distances, previous, unvisited);
    
          //No path exists
          if ((null == current) || (1/0 == distances[current])) {
              return {
                  'path': [],
                  'length': 1/0
              };
          };
          this._updateDistancesForCurrent(distances, previous, unvisited, current);     
          unvisited.remove(current);
      };
  }
}

void main() {
    Graph graph = new Graph(8, [
        [1, 2, 5], [1, 3, 1], [1, 4, 3],
        [2, 3, 2], [2, 5, 2],
        [3, 4, 1], [3, 5, 8],
        [4, 6, 2],
        [5, 7, 1],
        [6, 5, 1]
    ]);
  
    Map shortestPath = graph.getShortestPath(1, 7);

    print("path = ");
    print(shortestPath['path'].join(","));
    print("length = ");
    print(shortestPath['length']);
  
    //No shortest path to the vertex '8'
    print(graph.getShortestPath(1, 8));
}