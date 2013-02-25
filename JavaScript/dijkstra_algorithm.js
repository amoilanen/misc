Array.prototype.remove = Array.prototype.remove || function(element) {
    var index = this.indexOf(element);

    if (index >= 0) {
        this.splice(index, 1);
    };
};

Array.prototype.contains = Array.prototype.contains || function(element) {
    return this.indexOf(element) >= 0;
};

var graphs = {};

(function(host) {
    function Graph(nodesNumber, edges) {
        this.nodesNumber = nodesNumber;
        this.initEdges(edges);
    };

    Graph.prototype.initEdges = function(edges) {
        var oThis = this,
            i = 0;

        this.edges = [];
        for (; i < this.nodesNumber; i++) {
            this.edges[i] = [];
        };        
        if (edges) {
            edges.forEach(function (edge) {
                oThis.edge(edge[0], edge[1], edge[2]);
            });
        };
    };

    Graph.prototype.edge = function(from, to, weight) {
        this.edges[from - 1][to - 1] = weight;
        return this;
    };
    
    Graph.prototype._constructShortestPath = function(distances, previous, unvisited, to) {
        var vertex = to,
        path = [];

        while (undefined != vertex) {
            path.unshift(vertex + 1);
            vertex = previous[vertex];
        };
            
        return {
            path: path,
            length: distances[to]
        };
    };

    Graph.prototype._getUnvisitedVertexWithShortestPath = function(distances, previous, unvisited) {
        var minimumDistance = Number.MAX_VALUE,
            vertex = null;
            
        unvisited.forEach(function (unvisitedVertex) {
            if (distances[unvisitedVertex] < minimumDistance) {
                vertex = unvisitedVertex;
                minimumDistance = distances[vertex];
            };
        });
        return vertex;
    };
    
    Graph.prototype._updateDistancesForCurrent = function(distances, previous, unvisited, current) {    
        for (var i = 0; i < this.edges[current].length; i++) {
            var currentEdge = this.edges[current][i];
            
            if ((undefined != currentEdge) && unvisited.contains(i)) {
                if (distances[current] + currentEdge < distances[i]) {
                    distances[i] = distances[current] + currentEdge;
                    previous[i] = current;
                };
            };            
        };
    };

    //Dijkstra algorithm http://en.wikipedia.org/wiki/Dijkstra's_algorithm
    Graph.prototype.getShortestPath = function(from, to) {
        var unvisited = [],
            current = null,
            distances = [],
            previous = [];

        from = from - 1;        
        to = to - 1;
        //Initialization
        for (var i = 0; i < this.nodesNumber; i++) {
            unvisited.push(i);
            //Infinity
            distances.push(Number.MAX_VALUE);
        };
        distances[from] = 0;
        
        while (true) {
            if (!unvisited.contains(to)) {
                return this._constructShortestPath(distances, previous, unvisited, to);
            };
            current = this._getUnvisitedVertexWithShortestPath(distances, previous, unvisited);
        
            //No path exists
            if ((null == current) || (Number.MAX_VALUE == distances[current])) {
                return {
                    path: [],
                    length: Number.MAX_VALUE
                };
            };
            this._updateDistancesForCurrent(distances, previous, unvisited, current);            
            unvisited.remove(current);
        };
    };
    
    Graph.prototype.toString = function() {
        return this.edges.map(function (edgesFromVertex) {
            return edgesFromVertex.join(",")
        }).join("\n");        
    };
    host.Graph = Graph;
})(graphs);

var graph = new graphs.Graph(8, [
    [1, 2, 5], [1, 3, 1], [1, 4, 3],
    [2, 3, 2], [2, 5, 2],
    [3, 4, 1], [3, 5, 8],
    [4, 6, 2],
    [5, 7, 1],
    [6, 5, 1]
]);

var shortestPath = graph.getShortestPath(1, 7);

console.log("path = ", shortestPath.path.join(","));
console.log("length = ", shortestPath.length);

//No shortest path to the vertex '8'
console.log(graph.getShortestPath(1, 8));