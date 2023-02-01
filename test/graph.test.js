const { Graph, WeightedGraph, GraphDrawing } = require('../components/graph.js');

test('GraphDirected', () => {
    const g1 = new Graph(3);
    expect(g1.numVertices()).toBe(3);
    g1.addEdge(0, 1);
    expect(g1.getNeighbours(0)).toEqual([1]);
    expect(g1.getNeighbours(1)).toEqual([]);
    expect(g1.hasEdge(0, 1)).toBeTruthy();
    expect(g1.hasEdge(1, 0)).toBeFalsy();
});

test('GraphUndirected', () => {
    const g2 = new Graph(3, false);
    g2.addEdge(0, 1);
    expect(g2.getNeighbours(0)).toEqual([1]);
    expect(g2.getNeighbours(1)).toEqual([0]);
    expect(g2.hasEdge(0, 1)).toBeTruthy();
    expect(g2.hasEdge(1, 0)).toBeTruthy();
});

test('WeightedGraphDirected', () => {
    const wg1 = new WeightedGraph(3);
    wg1.addEdge(0, 1, 3);
    expect(wg1.getNeighbours(0)).toEqual([1]);
    expect(wg1.hasEdge(0, 1)).toBeTruthy();
    expect(wg1.hasEdge(1, 0)).toBeFalsy();
    expect(wg1.getWeight(0, 1)).toBe(3);
    expect(wg1.getWeight(1, 0)).toBeUndefined();

});

test('RandomGraph', () => {
    const rg = new Graph();
    rg.randomGraph(5);
    expect(rg.numVertices()).toBe(5);
    for (let i = 0; i < 5; i++)
        expect(rg.getNeighbours(i).length >= 0).toBeTruthy();
});

test('LatticeGraph', () => {
    const lg = new WeightedGraph();
    lg.latticeGraph(3, 5);
    expect(lg.numVertices()).toBe(15);

    lg.randomWeights(5, 7);
    for (let i = 0; i < 15; i++)
        for (let j = 0; j < 15; j++)
            if (lg.hasEdge(i, j))
                expect(5 <= lg.getWeight(i, j) && lg.getWeight(i, j) <= 7).toBeTruthy();
});

test('CircularArrangement', () => {
    const g = new Graph(4);
    g.randomGraph();
    const gd = new GraphDrawing(g);
    gd.circularArrangement(100, 100, 50);
    const expectedPos = [[100, 50], [50, 100], [100, 150], [150, 100]];
    for (let i = 0; i < 4; i++)
        gd.getPosition(i).forEach((x, k) => expect(x).toBeCloseTo(expectedPos[i][k]));
});

test('LatticeArrangement', () => {
    const g = new Graph(4);
    g.randomGraph();
    const gd = new GraphDrawing(g);
    gd.latticeArrangement(2, 2, 10, 10, 80, 80);
    const expectedPos = [[10, 10], [90, 10], [10, 90], [90, 90]];
    for (let i = 0; i < 4; i++)
        gd.getPosition(i).forEach((x, k) => expect(x).toBeCloseTo(expectedPos[i][k]));
});

test('TreeArrangement', () => {
    const g = new Graph(6);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(2, 3);
    g.addEdge(2, 4);
    g.addEdge(3, 5);
    g.addEdge(4, 5);
    const tree = [[0, 2], [2, 3], [3, 5], [5, 4], [0, 1]];
    const gd = new GraphDrawing(g);
    gd.treeArrangement(0, tree, 0, 0, 0, 100, 100);
    // FIXME: UNTESTED
});

test('dfs', () => {
    const g = new Graph(4, false);
    g.addEdge(0, 1);
    g.addEdge(1, 2);
    g.addEdge(0, 3);
    expect(g.dfs(0)).toEqual([[0, 1], [1, 2], [1], [0], [0, 3], [0]]);
});

test('bfs', () => {
    const g = new Graph(6, false);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(2, 4);
    g.addEdge(2, 5);
    expect(g.bfs(0)).toEqual([[0, 1], [0, 2], [1, 3], [2, 4], [2, 5]]);
});


test('dijkstra simple', () => {
    const g = new WeightedGraph(3, false);
    g.addEdge(0, 1, 9);
    g.addEdge(0, 2, 1);
    g.addEdge(1, 2, 5);
    const d = g.dijkstra(0);

    expect(d.dist).toEqual([ 0, 6, 1 ]);
    expect(d.vertexOrder).toEqual([ 0, 2, 1 ]);
});

test('dijkstra', () => {
    const g = new WeightedGraph(6, false);
    g.addEdge(0, 1, 9);
    g.addEdge(0, 2, 1);
    g.addEdge(1, 3, 9);
    g.addEdge(2, 3, 5);
    g.addEdge(2, 4, 6);
    g.addEdge(3, 5, 2);
    g.addEdge(4, 5, 3);
    const d = g.dijkstra(0);

    expect(d.dist).toEqual([0, 9, 1, 6, 7, 8]);
    expect(d.vertexOrder).toEqual([0, 2, 3, 4, 5, 1]);
});

test('prim', () => {
    const g = new WeightedGraph(6, false);
    g.addEdge(0, 1, 9);
    g.addEdge(0, 2, 1);
    g.addEdge(1, 3, 9);
    g.addEdge(2, 3, 5);
    g.addEdge(2, 4, 6);
    g.addEdge(3, 5, 2);
    g.addEdge(4, 5, 3);
    const mst = g.prim();
    expect(mst.mstWeight).toBe(20);
    expect(mst.mstEdges).toEqual([[1, 0, 2], [5, 2, 3], [2, 3, 5], [3, 5, 4], [9, 0, 1]]);
    expect(mst.vertexOrder).toEqual([0, 2, 3, 5, 4, 1]);
});

test('kruskal', () => {
    const g = new WeightedGraph(6, false);
    g.addEdge(0, 1, 9);
    g.addEdge(0, 2, 1);
    g.addEdge(1, 3, 9);
    g.addEdge(2, 3, 5);
    g.addEdge(2, 4, 6);
    g.addEdge(3, 5, 2);
    g.addEdge(4, 5, 3);
    const mst = g.kruskal();
    expect(mst.mstWeight).toEqual(20);
    expect(mst.mstEdges).toEqual([[1, 0, 2], [2, 3, 5], [3, 4, 5], [5, 2, 3], [9, 0, 1]]);
});

test('floydWarshall', () => {
    const g = new WeightedGraph(6, false);
    g.addEdge(0, 1, 9);
    g.addEdge(0, 2, 1);
    g.addEdge(1, 3, 9);
    g.addEdge(2, 3, 5);
    g.addEdge(2, 4, 6);
    g.addEdge(3, 5, 2);
    g.addEdge(4, 5, 3);
    const r = g.floydWarshall();
    // FIXME
});

test('select', () => {
    const g = new Graph(4);
    g.randomGraph();
    g.addEdge(0, 1);
    const gd = new GraphDrawing(g);
    gd.circularArrangement(100, 100, 50);
    expect(gd.vertexOn(100, 150)).toBe(2);
    expect(gd.vertexOn(103, 147)).toBe(2);
    expect(gd.vertexOn(110, 140)).toBe(2);
    expect(gd.vertexOn(110, 130)).toBeUndefined();
    gd.focusVertexOn(100, 150);
    expect(gd.focusVertex).toBe(2);
    gd.focusVertexOn(50, 100);
    expect(gd.focusVertex).toBe(1);
    expect(gd.edgeOn(75, 75).sort()).toEqual([0, 1]);
    gd.focusEdgeOn(75, 75);
    expect(gd.focusEdge.sort()).toEqual([0, 1]);
    gd.focusEdgeOn(200, 200);
    expect(gd.focusEdge).toBeUndefined();
    gd.setEdgeLabel([2, 3], "a");
    expect(gd.getEdgeLabel([2, 3])).toBe("a");
    gd.removeEdgeLabel([2, 3]);
    expect(gd.getEdgeLabel([2, 3])).toBeUndefined();
    expect(gd.getEdgeLabel([1, 2])).toBeUndefined();
    gd.removeEdgeLabel([1, 2]);
    expect(gd.getEdgeLabel([1, 2])).toBeUndefined();
    gd.setVertexLabel(0, "x");
    expect(gd.getVertexLabel(0)).toBe("x");
    gd.removeVertexLabel(0);
    expect(gd.getVertexLabel(0)).toBeUndefined();
});
