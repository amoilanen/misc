interface Array {
    remove(element: any): void;
    contains(element: any): bool;
}

Array.prototype.remove = Array.prototype.remove || function(element) {
    var index = this.indexOf(element);

    if (index >= 0) {
        this.splice(index, 1);
    };
};

Array.prototype.contains = Array.prototype.contains || function(element) {
    return this.indexOf(element) >= 0;
};

module graphs {
    export class Graph {
    
        edges: number[][];
    
        constructor(public nodesNumber: number, edges: number[][]) {
            this.initEdges(edges);
        }
        
        initEdges(edges: number[][]): void {
            var oThis = this,
            i = 0;

            this.edges = [];
            for (; i < this.nodesNumber; i++) {
                this.edges[i] = [];
            };        
            if (edges) {
                edges.forEach(function (edge) {
                    oThis.edge.apply(oThis, edge);
                });
            };
        }
        
        edge(from: number, to: number, weight: number): Graph {
            this.edges[from - 1][to - 1] = weight;
            return this;
        }

        //Dijkstra algorithm http://en.wikipedia.org/wiki/Dijkstra's_algorithm
        getShortestPath(from: number, to: number): {path: number[]; length: number;} {
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
        }

        private _constructShortestPath(distances: number[], previous: number[],
             unvisited: number[], to: number): { path: number[]; length: number; } {
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
        }

        private _getUnvisitedVertexWithShortestPath(distances: number[], previous: number[], unvisited: number[]): number {
            var minimumDistance = Number.MAX_VALUE,
                vertex = null;
            
            unvisited.forEach(function (unvisitedVertex) {
                if (distances[unvisitedVertex] < minimumDistance) {
                    vertex = unvisitedVertex;
                    minimumDistance = distances[vertex];
                };
            });
            return vertex;
        }

        private _updateDistancesForCurrent(distances: number[], previous: number[], unvisited: number[], current: number): void {    
            for (var i = 0; i < this.edges[current].length; i++) {
                var currentEdge = this.edges[current][i];
            
                if ((undefined != currentEdge) && unvisited.contains(i)) {
                    if (distances[current] + currentEdge < distances[i]) {
                        distances[i] = distances[current] + currentEdge;
                        previous[i] = current;
                    };
                };            
            };
        }
    }
}

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