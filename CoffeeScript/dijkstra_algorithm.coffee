Array::remove = Array::remove || (element) ->
    index = @indexOf(element)
    @splice(index, 1) if index >= 0

graphs = {}

graphs.Graph = class Graph

    constructor: (@nodesNumber, edges) ->
        @initEdges(edges)

    initEdges: (edges) ->
        @edges = []
        @edges[i] = [] for i in [0..@nodesNumber]
        @edge edge... for edge in edges if edges
    
    edge: (from, to, weight) ->
        @edges[from - 1][to - 1] = weight

    _constructShortestPath = (distances, previous, unvisited, to) ->
        vertex = to
        path = []

        while vertex?
            path.unshift(vertex + 1);
            vertex = previous[vertex];

        path: path
        length: distances[to]
        
    _getUnvisitedVertexWithShortestPath = (distances, previous, unvisited) ->
        minimumDistance = Number.MAX_VALUE

        for unvisitedVertex in unvisited
            if (distances[unvisitedVertex] < minimumDistance)
                vertex = unvisitedVertex
                minimumDistance = distances[vertex]

        vertex

    _updateDistancesForCurrent: (distances, previous, unvisited, current) ->
        for edge, i in @edges[current]
            if ((undefined != edge) && edge >= 0 && i in unvisited && (distances[current] + edge < distances[i]))
                distances[i] = distances[current] + edge
                previous[i] = current

    #Dijkstra algorithm http://en.wikipedia.org/wiki/Dijkstra's_algorithm
    getShortestPath: (from, to) ->
        unvisited = []
        current = null
        distances = []
        previous = []

        from = from - 1        
        to = to - 1

        #Initialization
        for i in [0..@nodesNumber]
            unvisited.push(i)
            #Infinity
            distances.push(Number.MAX_VALUE)

        distances[from] = 0
        
        while (true)
            if (not (to in unvisited))
                return _constructShortestPath(distances, previous, unvisited, to);

            current = _getUnvisitedVertexWithShortestPath(distances, previous, unvisited)
        
            #No path exists
            if ((null == current) || (undefined == current) || (Number.MAX_VALUE == distances[current]))
                return {
                    path: []
                    length: Number.MAX_VALUE
                }

            @_updateDistancesForCurrent(distances, previous, unvisited, current)            
            unvisited.remove(current)

        return

graph = new graphs.Graph(8, [
    [1, 2, 5], [1, 3, 1], [1, 4, 3],
    [2, 3, 2], [2, 5, 2],
    [3, 4, 1], [3, 5, 8],
    [4, 6, 2],
    [5, 7, 1],
    [6, 5, 1]
]);

shortestPath = graph.getShortestPath(1, 7)

console.log("path = ", shortestPath.path.join(","))
console.log("length = ", shortestPath.length)

#No shortest path to the vertex '8'
console.log(graph.getShortestPath(1, 8))