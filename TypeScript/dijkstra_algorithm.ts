/*
 * clear && ts-node dijkstra_algorithm.ts
 */

interface Array<T> {
  remove(element: any): void;
}

Array.prototype.remove = Array.prototype.remove || function(element) {
  const index = this.indexOf(element);

  if (index >= 0) {
    this.splice(index, 1);
  };
};

function rangeTo(upTo: number) {
  return Array.from(Array(upTo).keys());
}

class GraphNode {
  constructor(public id: number) {}
}

class Edge {
  constructor(public from: GraphNode, public to: GraphNode, public weight: number) {}

  static edge(from: GraphNode, to: GraphNode, weight: number): Edge {
    return new Edge(from, to, weight);
  }
}

const edge = Edge.edge;

interface GraphPath {
  path: number[];
  length: number;
}


class Graph {

  edgeWeights: Array<Array<number>>;

  constructor(public nodesNumber: number, edges: Array<Edge>) {
    this.initEdges(edges);
  }

  private initEdges(edges: Array<Edge>): void {
    this.edgeWeights = rangeTo(this.nodesNumber)
      .map(_ => []);
    edges.forEach(edge =>
      this.addEdge(edge)
    );
  }

  private addEdge(edge: Edge): void {
    this.edgeWeights[edge.from.id][edge.to.id] = edge.weight;
  }

  //Dijkstra algorithm http://en.wikipedia.org/wiki/Dijkstra's_algorithm
  getShortestPath(startNode: GraphNode, destinationNode: GraphNode): GraphPath {
    const notVisitedNodes: Array<number> = rangeTo(this.nodesNumber);
    const distancesFromStart: Array<number> = rangeTo(this.nodesNumber).map(_ => Number.MAX_VALUE);
    distancesFromStart[startNode.id] = 0;

    let current: number | null = null;

    const backReferences: Array<number> = [];

    while (true) {
      if (notVisitedNodes.includes(destinationNode.id)) {
        current = this.getNotVisitedNodeWithShortestPath(distancesFromStart, notVisitedNodes);

        //No path exists
        if ((null === current) || (Number.MAX_VALUE == distancesFromStart[current])) {
          return {
            path: [],
            length: Number.MAX_VALUE
          };
        } else {
          this.updateDistancesForCurrent(distancesFromStart, backReferences, notVisitedNodes, current);
          notVisitedNodes.remove(current);
        }
      } else {
        return this.constructShortestPath(distancesFromStart, backReferences, destinationNode.id);
      }
    };
  }

  private constructShortestPath(distancesFromStart: number[], nodeBackReferences: number[], destinationNode: number): GraphPath {
    let currentNode = destinationNode;
    const path = [];

    while (undefined !== currentNode) {
      path.unshift(currentNode);
      currentNode = nodeBackReferences[currentNode];
    }

    return {
      path,
      length: distancesFromStart[destinationNode]
    };
  }

  private getNotVisitedNodeWithShortestPath(distancesFromStart: number[], notVisitedNodes: number[]): number {
    let minimumDistance: number = Number.MAX_VALUE;
    let node: number | null = null;

    notVisitedNodes.forEach(function (unvisitedVertex) {
      if (distancesFromStart[unvisitedVertex] < minimumDistance) {
        node = unvisitedVertex;
        minimumDistance = distancesFromStart[node];
      };
    });
    return node;
  }

  private updateDistancesForCurrent(distancesFromStart: number[], nodeBackReferences: number[], notVisitedNodes: number[], currentNode: number): void {
    for (let node = 0; node < this.edgeWeights[currentNode].length; node++) {
      const weightOfEdgeToNode = this.edgeWeights[currentNode][node];

      if ((undefined != weightOfEdgeToNode) && notVisitedNodes.includes(node)) {
        if (distancesFromStart[currentNode] + weightOfEdgeToNode < distancesFromStart[node]) {
          distancesFromStart[node] = distancesFromStart[currentNode] + weightOfEdgeToNode;
          nodeBackReferences[node] = currentNode;
        };
      };
    };
  }
}

const nodeNumber = 8;
const nodes: Array<GraphNode> = rangeTo(nodeNumber).map(id => new GraphNode(id));

const graph = new Graph(8, [
  edge(nodes[0], nodes[1], 5), edge(nodes[0], nodes[2], 1), edge(nodes[0], nodes[3], 3),
  edge(nodes[1], nodes[2], 2), edge(nodes[1], nodes[4], 2),
  edge(nodes[2], nodes[3], 1), edge(nodes[2], nodes[4], 8),
  edge(nodes[3], nodes[5], 2),
  edge(nodes[4], nodes[6], 1),
  edge(nodes[5], nodes[4], 1)
]);

// Shortest path to the vertex '6'
// { path: [ 0, 2, 3, 5, 4, 6 ], length: 6 }
console.log(graph.getShortestPath(nodes[0], nodes[6]));

// No shortest path to the vertex '7'
console.log(graph.getShortestPath(nodes[0], nodes[7]));