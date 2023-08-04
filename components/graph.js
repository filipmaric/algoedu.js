import { hsvColor } from './colors.js';
import { shuffle } from './util.js';
import { UnionFind } from './union_find.js';

export class Graph {
    constructor(n=0, directed=true) {
        this.directed = directed;
        this.weighted = false;
        this.emptyGraph(n);
    }

    numVertices() {
        return this.neighbours.length;
    }

    addVertex() {
        this.neighbours.push([]);
        return this.numVertices() - 1;
    }

    addEdge(i, j) {
        this.neighbours[i].push(j);
        if (!this.directed)
            this.neighbours[j].push(i);
    }

    removeEdge(i, j) {
        this.neighbours[i] = this.neighbours[i].filter(item => item != j);
        if (!this.directed)
            this.neighbours[j] = this.neighbours[j].filter(item => item != i);
    }

    hasEdge(i, j) {
        return this.neighbours[i].includes(j);
    }

    getEdges() {
        if (this.directed)
            return this.neighbours.map((ns, v) => ns.map(n => [v, n])).flat(1);
        else
            return this.neighbours.map((ns, v) => ns.map(n => [v, n])).flat(1).filter(edge => edge[0] <= edge[1]);
    }

    getNeighbours(i) {
        return this.neighbours[i];
    }

    emptyGraph(n) {
        this.neighbours = Array.from({length: n}, () => []);
    }

    sortNeighbours() {
        for (let i = 0; i < this.neighbours.length; i++)
            this.neighbours[i].sort((a, b) => a-b);
    }
    
    fullGraph(n) {
        if (n === undefined)
            n = this.numVertices();
        this.emptyGraph(n);
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                if (i < j)
                    this.addEdge(i, j);
        this.sortNeighbours();
    }
    
    randomGraph(n, prob=0.25) {
        if (n === undefined)
            n = this.numVertices();
        
        this.emptyGraph(n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++)
                if (i != j && (i < j || !this.hasEdge(j, i)) && Math.random() < (i == 0 ? 2*prob : prob))
                    this.addEdge(i, j);
            if (this.getNeighbours(i).length == 0) {
                let j;
                do {
                    j = Math.floor(Math.random() * n);
                } while (j == i);
                this.addEdge(i, j);
            }
        }
        this.sortNeighbours();
    }

    // random tree with n vertices and edges chosen from the given set of edges
    static randomTree(n, edges) {
        const treeEdges = [];
        const unionFind = new UnionFind(n);

        if (edges === undefined) {
            edges = [];
            for (let i = 0; i < n - 1; i++) {
                for (let j = i + 1; j < n; j++) {
                    edges.push([i, j]);
                }
            }            
        }

        shuffle(edges);

        for (const [nodeA, nodeB] of edges) {
            if (unionFind.union(nodeA, nodeB))
                treeEdges.push([nodeA, nodeB]);
            if (treeEdges.length == n - 1)
                break;
        }
        return treeEdges;
    }

    static latticeGraphEdges(m, n, diagonals) {
        function vertex(i, j) {
            return i * n + j;
        }

        const edges = [];

        for (let i = 0; i < m; i++)
            for (let j = 1; j < n; j++) {
                const edge = [vertex(i, j-1), vertex(i, j)];
                edges.push(edge);
            }

        for (let j = 0; j < n; j++)
            for (let i = 1; i < m; i++) {
                const edge = [vertex(i-1, j), vertex(i, j)];
                edges.push(edge);
            }

        if (diagonals) {
            for (let i = 1; i < m; i++)
                for (let j = 1; j < n; j++) {
                    const edge = [vertex(i-1, j-1), vertex(i, j)];
                    edges.push(edge);
                }

            for (let i = 0; i < m-1; i++)
                for (let j = 1; j < n; j++) {
                    const edge = [vertex(i, j), vertex(i+1, j-1)];
                    edges.push(edge);
                }
        }
        return edges;
    }

    static orientTree(edges, root) {
        function dfs(node) {
            visited.push(node);
            const nodeEdges = edges.filter(edge => edge.includes(node));
            const neighbours = nodeEdges.map(edge => edge.filter(x => x != node)).flat(1);
            neighbours.forEach(neighbour => {
                if (!visited.includes(neighbour)) {
                    orientedEdges.push([node, neighbour]);
                    dfs(neighbour);
                }
            });
        }
        const visited = [];
        const orientedEdges = [];
        dfs(root);
        return orientedEdges;
    }

    latticeGraph(m, n) {
        this.emptyGraph(m * n);
        for (const [nodeA, nodeB] of Graph.latticeGraphEdges(m, n, false))
            this.addEdge(nodeA, nodeB);
        this.sortNeighbours();
    }

    randomLatticeGraph(m, n, numEdges) {
        this.emptyGraph(m * n);

        const edges = Graph.latticeGraphEdges(m, n, true);

        shuffle(edges);
        for (let i = 0; i < numEdges && i < edges.length; i++)
            this.addEdge(...edges[i]);
        
        this.sortNeighbours();
    }

    randomConnectedLatticeGraph(m, n, numEdges) {
        this.emptyGraph(m * n);
        const edges = Graph.latticeGraphEdges(m, n, true);
        const tree = Graph.orientTree(Graph.randomTree(this.numVertices(), edges), 0);
        const eqEdges = (edge1, edge2) => (edge1[0] == edge2[0] && edge1[1] == edge2[1]) ||
                                          (edge1[0] == edge2[1] && edge1[1] == edge2[0]);
        const remainingEdges = edges.filter(edge => !tree.some(edge1 => eqEdges(edge, edge1)));
        tree.forEach(edge => this.addEdge(...edge));
        for (let i = 0; i < numEdges - tree.length && i < remainingEdges.length; i++)
            this.addEdge(...remainingEdges[i]);
        this.sortNeighbours();
    }
    
    static adjacencyLists(n, edges, reverse=false) {
        const neighbours = [...Array(n)].map(i => []);
        edges.forEach(edge => {
            let [a, b] = edge;
            if (reverse)
                [a, b] = [b, a];
            neighbours[a].push(b);
        });
        return neighbours;
    }

    dfsPrePost(startVertex, preprocess, postprocess) {
        function dfsRecPrePost(vertex) {
            if (visited[vertex])
                return;
            visited[vertex] = true;
            preprocess(vertex);
            this.neighbours[vertex].forEach(neighbour => {
                if (neighbour != null && !visited[neighbour])
                    this.dfsRec(neighbour, visited, trace);
            });
            postprocess(vertex);
        }
        const visited = new Array(this.numVertices()).fill(false);
        dfsRecPrePost(startVertex);
    }

    dfsRec(vertex, visited, trace) {
        if (visited[vertex])
            return;
        visited[vertex] = true;
        this.neighbours[vertex].forEach(neighbour => {
            if (neighbour != null && !visited[neighbour]) {
                trace.push([vertex, neighbour]);
                this.dfsRec(neighbour, visited, trace);
                trace.push([vertex]);
            }
        });
    }

    dfs(vertex=0) {
        const visited = new Array(this.numVertices()).fill(false);
        const trace = []
        this.dfsRec(vertex, visited, trace);
        return trace;
    }

    dfsTree(vertex=0) {
        return this.dfs(vertex).filter(item => item.length == 2);
    }

    dfsParent(vertex=0) {
        const parent = new Array(this.numVertices()).fill(-1);
        this.dfsTree(vertex).forEach(edge => {
            const [from, to] = edge;
            parent[to] = from;
        });
        return parent;
    }

    dfsOrder(vertex=0) {
        const treeEdges = this.dfsTree(0);
        let order = treeEdges.map(edge => edge[1]);
        order.unshift(treeEdges[0][0]);
        return order;
    }
    
    dfsForrest(roots) {
        const visited = new Array(this.numVertices()).fill(false);
        const trace = [];
        if (roots === undefined) {
            for (let i = 0; i < this.numVertices(); i++)
                if (!visited[i])
                    this.dfsRec(i, visited, trace);
        } else {
            roots.forEach(i => {
                if (!visited[i])
                    this.dfsRec(i, visited, trace);
            });
        }
        return trace.filter(item => item.length == 2);
    }

    dfsPreorderNumeration(vertex=0) {
        const dfsTrace = this.dfs(vertex);
        const preorder = new Array(this.numVertices()).fill(-1);
        if (dfsTrace.length == 0)
            return preorder;
        let preorderNum = 0;
        const start = dfsTrace[0][0];
        preorder[start] = preorderNum++;
        dfsTrace.forEach(data => {
            if (data.length == 2) {
                const [from, to] = data;
                preorder[to] = preorderNum++;
            }
        });
        return preorder;
    }

    dfsPostorderNumeration(vertex=0) {
        const dfsTrace = this.dfs(vertex);
        const postorder = new Array(this.numVertices()).fill(-1);
        if (dfsTrace.length == 0)
            return postorder;
        let postorderNum = 0;
        const start = dfsTrace[0][0];
        const stack = [];
        dfsTrace.forEach(data => {
            if (data.length == 2) {
                const [from, to] = data;
                stack.push(to);
            } else if (data.length == 1) {
                const to = stack.pop();
                postorder[to] = postorderNum++;
            }
        });
        postorder[start] = postorderNum++;
        return postorder;
    }

    dfsLowlink(vertex = 0) {
        const lowlink = new Array(this.numVertices()).fill(-1);
        const parent = new Array(this.numVertices()).fill(-1);
        let preorderNum = 0;
        const preorder = new Array(this.numVertices()).fill(-1);
        const order = [];

        const self = this;
        function dfsRec(vertex) {
            order.push(vertex);
            preorder[vertex] = lowlink[vertex] = preorderNum++;
            self.neighbours[vertex].forEach(neighbour => {
                if (preorder[neighbour] == -1) {
                    parent[neighbour] = vertex;
                    dfsRec(neighbour);
                    if (lowlink[neighbour] < lowlink[vertex])
                        lowlink[vertex] = lowlink[neighbour];
                } else if (neighbour != parent[vertex]) {
                    if (preorder[neighbour] < lowlink[vertex])
                        lowlink[vertex] = preorder[neighbour];
                }
            });
        }

        dfsRec(vertex);
        return lowlink.map(l => order[l]);
    }

    bridges() {
        if (this.directed)
            throw "Bridges are not yet implemented for directed graphs";
        const lowlink = graph.dfsLowlink(0);
        const preorder = graph.dfsPreorderNumeration(0);
        const bridges = this.dfsTree(0).filter(edge => {
            const [from, to] = edge;
            return preorder[from] < preorder[to] &&
                   preorder[lowlink[to]] > preorder[from];
        });
        return bridges;
    }

    articulationPoints() {
        if (this.directed)
            throw "Articulation points are not yet implemented for directed graphs";
        const aps = [];
        const start = 0;
        const lowlink = graph.dfsLowlink(start);
        const preorder = graph.dfsPreorderNumeration(start);
        const dfsTree = graph.dfsTree(start);
        const treeNeighbours = Graph.adjacencyLists(this.numVertices(), dfsTree);
        
        for (let u = 1; u < this.numVertices(); u++) {
            for (const v of treeNeighbours[u])
                if (preorder[lowlink[v]] >= preorder[u]) {
                    aps.push(u);
                    break;
                }
        }
            
        return aps;
    }
        
    bfs(vertex) {
        const self = this;
        const visited = new Array(this.numVertices()).fill(false);
        const trace = [];
        const queue = [];
        queue.push(vertex);
        visited[vertex] = true;
        while (queue.length > 0) {
            vertex = queue.shift();
            self.neighbours[vertex].forEach(neighbour => {
                if (!visited[neighbour]) {
                    queue.push(neighbour);
                    visited[neighbour] = true;
                    trace.push([vertex, neighbour]);
                }
            });
        }
        return trace;
    }

    normalizeEdge(edge) {
        if (!this.directed && edge[0] > edge[1])
            return [edge[1], edge[0]];
        return edge;
    }

    // auxiliary function -- check if two edges are equal
    static equalEdges(g1, g2) {
        if (!g1 || !g2)
            return false;
        var [a1, b1] = g1;
        var [a2, b2] = g2;
        return a1 == a2 && b1 == b2;
    }
}

export class WeightedGraph extends Graph {
    constructor(n=0, directed=true) {
        super(n)
        this.weighted = true;
        this.directed = directed;
    }

    emptyGraph(n) {
        super.emptyGraph(n);
        this.weights = Array.from({length: n}, () => Array(n).fill(undefined));
    }

    addEdge(i, j, w) {
        super.addEdge(i, j);
        this.weights[i][j] = w;
        if (!this.directed)
            this.weights[j][i] = w;
    }


    setWeight(i, j, w) {
        this.weights[i][j] = w;
        if (!this.directed)
            this.weights[j][i] = w;
    }

    getWeight(i, j) {
        return this.weights[i][j];
    }
    
    getWeightedEdges() {
        const n = this.numVertices();
        const edges = [];
        for (let vertex = 0; vertex < n; vertex++)
            this.neighbours[vertex].forEach(neighbour => {
                if (this.directed || vertex < neighbour)
                    edges.push([this.weights[vertex][neighbour], vertex, neighbour]);
            });
        return edges;
    }

    randomWeights(minWeight, maxWeight) {
        const n = this.numVertices();
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
                const w = minWeight + Math.floor((maxWeight - minWeight + 1) * Math.random());
                if (this.hasEdge(i, j))
                    this.setWeight(i, j, w);
            }
    }

    randomGraph(n, minWeight=1, maxWeight=100, prob=0.25) {
        super.randomGraph(n, prob);
        this.randomWeights(minWeight, maxWeight);
    }

    fullGraph(n, minWeight=1, maxWeight=100) {
        super.fullGraph(n);
        this.randomWeights(minWeight, maxWeight);
    }

    latticeGraph(m, n, minWeight=1, maxWeight=100) {
        super.latticeGraph(m, n);
        this.randomWeights(minWeight, maxWeight);
    }
    
    dijkstra(vertex=0) {
        const n = this.numVertices();
        let numChanges = 0;
        const vertexOrder = []
        const table = [];
        const dist = new Array(n).fill(Infinity);
        dist[vertex] = 0;
        table.push([...dist]);
        
        const isSolved = new Array(n).fill(false);
        const parents = [new Array(n).fill(null)];
        for (let i = 0; i < n; i++) {
            let min = -1;
            for (let j = 0; j < n; j++) {
                if (isSolved[j])
                    continue;
                if (min == -1 || dist[j] < dist[min])
                    min = j;
            }
            isSolved[min] = true;
            vertexOrder.push(min);
            const minParents  = [...parents[parents.length - 1]];
            this.neighbours[min].forEach(neighbour => {
                if (dist[min] + this.weights[min][neighbour] < dist[neighbour]) {
                    minParents[neighbour] = min;
                    if (dist[neighbour] < Infinity)
                        numChanges++;
                    dist[neighbour] = dist[min] + this.weights[min][neighbour];
                }
            });
            table.push([...dist]);
	    parents.push(minParents);
        }
        return {dist: dist, vertexOrder: vertexOrder, table: table, parents: parents, numChanges: numChanges};
    }

    prim() {
        let mstWeight = 0;
	const mstEdges = [];
	let vertex = 0;
	const vertexOrder = [];
	vertexOrder.push(vertex);
	let candidateEdges = [];
	while (vertexOrder.length < this.numVertices()) {
	    candidateEdges = candidateEdges.filter(g => g[2] != vertex);
	    this.neighbours[vertex].forEach(neighbour => { 
		if (!vertexOrder.includes(neighbour))
		    candidateEdges.push([this.weights[vertex][neighbour], vertex, neighbour]);
	    });
	    let minEdge = 0;
	    for (let edge = 1; edge < candidateEdges.length; edge++) {
		if (candidateEdges[edge][0] < candidateEdges[minEdge][0] ||
                    (candidateEdges[edge][0] == candidateEdges[minEdge][0] &&
                     candidateEdges[edge][2] < candidateEdges[minEdge][2]))
		    minEdge = edge;
	    }
	    vertex = candidateEdges[minEdge][2];
	    mstEdges.push(candidateEdges[minEdge]);
            mstWeight += candidateEdges[minEdge][0];
	    candidateEdges.splice(minEdge, 1);
	    vertexOrder.push(vertex);
	}
	return {vertexOrder: vertexOrder, mstEdges: mstEdges, mstWeight: mstWeight};
    }

    kruskal() {
        const n = this.numVertices();
        const sortedEdges = this.getWeightedEdges().sort((a, b) => {
            if (a[0] < b[0]) return -1;
            else if (a[0] > b[0]) return 1;
            else if (a[1] < b[1]) return -1;
            else if (a[1] > b[1]) return 1;
            else return a[2] - b[2];
        });
        
        const color = new Array(n);
        for (var vertex = 0; vertex < n; vertex++)
            color[vertex] = vertex;
        
        const mstEdges = [];
        const allEdges = []
        let mstWeight = 0;
        for (let i = 0; i < sortedEdges.length; i++) {
            var [weight, vertexA, vertexB] = sortedEdges[i];
            if (color[vertexA] != color[vertexB]) {
                mstEdges.push([weight, vertexA, vertexB]);
                mstWeight += weight;
                allEdges.push([vertexA, vertexB, true]);
            } else
                allEdges.push([vertexA, vertexB, false]);

            const colorA = color[vertexA], colorB = color[vertexB];
            for (let vertex = 0; vertex < n; vertex++)
                if (color[vertex] == colorA)
                    color[vertex] = colorB;
        }
        return {mstWeight: mstWeight, mstEdges: mstEdges, allEdges: allEdges};
    }

    // FIXME: UNTESTED
    floydWarshall() {
	function cloneMatrix(M) {
	    const clone = new Array(M.length);
	    for (var i = 0; i < M.length; i++)
		clone[i] = [...M[i]];
	    return clone;
	}

	const n  = this.numVertices();
	const M = new Array(n);
        const Mp = new Array(n);
	for (let i = 0; i < n; i++) {
	    M[i] = new Array(n).fill(Infinity);
	    Mp[i] = new Array(n).fill([]);
	}

        for (let i = 0; i < n; i++) {
	    this.neighbours[i].forEach((j, s) => {
		M[i][s] = this.weights[i][j];
		Mp[i][s] = [i, s];
	    });
	    M[i][i] = 0;
	}
        
	let Ms = [cloneMatrix(M)];
	let Mps = [cloneMatrix(Mp)];

	for (let k = 0; k < n; k++) {
	    for (let i = 0; i < n; i++)
		for (let j = 0; j < n; j++) {
		    if (M[i][k] + M[k][j] < M[i][j])
			Mp[i][j] = Mp[i][k].concat(Mp[k][j].slice(1));
		    M[i][j] = Math.min(M[i][j], M[i][k] + M[k][j]);
		}
	    Ms.push(cloneMatrix(M));
	    Mps.push(cloneMatrix(Mp));
	}

	return [Ms, Mps];
    }
}


export class BinaryTree extends Graph {
    constructor() {
        super(0, true);
        this.neighbours = []
    }

    addVertex() {
        const n = this.numVertices();
        this.neighbours.push([null, null]);
        return n;
    }

    numVertices() {
        return this.neighbours.length;
    }

    setLeftChild(parent, child) {
        this.neighbours[parent][0] = child;
    }
    
    setRightChild(parent, child) {
        this.neighbours[parent][1] = child;
    }
}


class GraphDrawingCanvas {
    constructor(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d");
        
        // Set display size (css pixels).
        this._canvas.style.width = canvas.width + "px";
        this._canvas.style.height = canvas.height + "px";

        // Set actual size in memory (scaled to account for extra pixel density).
        const scale = window.devicePixelRatio;
        canvas.width = canvas.width * scale;
        canvas.height = canvas.height * scale;

        // Normalize coordinate system to use css pixels.
        this._ctx.scale(scale, scale);
        this._scale = scale;
    }

    width() {
        return this._canvas.width / this._scale;
    }

    height() {
        return this._canvas.height / this._scale;
    }

    ctx() {
        return this._ctx;
    }

    getBoundingClientRect() {
        return this._canvas.getBoundingClientRect();
    }

    addEventListener(event, handler) {
        this._canvas.addEventListener(event, handler);
    }
}

export class GraphDrawing {
    constructor(graph, canvas, width, height) {
        if (width)
            canvas.width = width;
        if (height)
            canvas.height = height;
        
        this.graph = graph;
        
        const n = graph.numVertices();
        
        this.vertexPosition = Array.from({length: n}, () => [0, 0]);
        
        this.vertexLabels = Array.from({length: n}, () => undefined);
        this.vertexContent = Array.from({length: n}, () => undefined);
        this.vertexCSS = Array.from({length: n}, () => undefined);
        
        this.edgeLabels = {}
        this.edgeCSS = {}

        if (graph.weighted)
            this.setWeightLabels();

        this.focusVertex = undefined;
        this.focusEdge = undefined;
        
        this.selectedVertices = [];
        this.selectedEdges = [];
        this.singleSelectVertex = true;
        this.singleSelectEdge = false;

        if (canvas != undefined)
            this.canvas = new GraphDrawingCanvas(canvas);

        this.setCSS();
    }

    width() {
        return this.canvas.width();
    }

    height() {
        return this.canvas.height();
    }
    
    numVertices() {
        return this.graph.numVertices();
    }

    addVertex() {
        const vertex = this.graph.addVertex();
        this.vertexPosition.push([0, 0]);
        this.vertexLabels.push(undefined);
        this.vertexCSS.push(undefined);
        return vertex;
    }

    setPosition(i, pos) {
        this.vertexPosition[i] = pos;
    }

    getPosition(i) {
        return this.vertexPosition[i];
    }

    circularArrangementPosition(cx, cy, r) {
        const n = this.numVertices();
        
        function position(vertex) {
            const alpha = Math.PI / 2 + vertex * (2*Math.PI / n);
            const x = cx + r * Math.cos(alpha);
            const y = cy - r * Math.sin(alpha);
            return [x, y];
        }
        return [...Array(n).keys()].map(vertex => position(vertex));
    }
    
    circularArrangement(cx, cy, r) {
        this.vertexPosition = this.circularArrangementPosition(cx, cy, r);
        this.draw();
    }

    latticeArrangementPosition(m, n, x0, y0, width, height) {
        function position(vertex, m, n) {
            const j = vertex % n;
            const i = Math.floor(vertex / n);
            const w = width / (n-1), h = height / (m-1);
            const x = x0 + j * w;
            const y = y0 + i * h;
            return [x, y];
        }
        return [...Array(this.numVertices()).keys()].map(vertex => position(vertex, m, n));
    }
    
    latticeArrangement(m, n, x0, y0, width, height) {
        this.vertexPosition = this.latticeArrangementPosition(m, n, x0, y0, width, height);
        this.draw();
    }

    treeCoordinates(treeNeighbours, root, xStart, yStart) {
        // we arrange the tree recursively
        // visited nodes during tree traversal
        const visited = new Array(this.numVertices()).fill(false);
        // maximal dept of a tree node
        let maxDepth = 0;

        const coords = new Array(this.numVertices());
        // we draw the tree rooted at the given depth on a coordinate xStart
        // and return the x coordinate where its next sibling on that depth should be
        function positionRec(vertex, xStart, depth) {
            if (vertex == null)
                return xStart+1;
            
            visited[vertex] = true;
            if (depth > maxDepth)
                maxDepth = depth;
            let x = xStart;
            treeNeighbours[vertex].forEach(neighbour => {
                x = positionRec(neighbour, x, depth+1);
            });
            
            if (treeNeighbours[vertex].length == 0) {
                coords[vertex] = [xStart, yStart + depth];
                return xStart+1;
            } else {
                coords[vertex] = [(x + xStart - 1) / 2, yStart + depth];
                return x;
            }
        }

        const xEnd = positionRec(root, xStart, yStart) - 1;
        return {visited: visited, coords: coords, xEnd: xEnd, yEnd: yStart + maxDepth};
    }


    treeArrangementPositionNeigbours(initialVertexPosition, root, treeNeighbours, x0, y0, width, height, reverse=false) {
        // special case when root has no edges
        if (treeNeighbours[root].filter(neighbour => neighbour != null).length == 0) {
            const result = [...initialVertexPosition];
            result[root] = [x0 + width/2, y0 + height/2];
            return result;
        }
        
        const xStart = 0;
        const yStart = 0;
        const coordinates = this.treeCoordinates(treeNeighbours, root, xStart, yStart);
        
        let dh = height / (coordinates.yEnd - yStart + 1);
        let dw = width / (coordinates.xEnd - xStart + 1);
        return initialVertexPosition.map((p, vertex) => {
            if (!coordinates.visited[vertex])
                return p;
            else {
                const [x, y] = coordinates.coords[vertex];
                return [x0 + dw / 2 + x * dw, y0 + dh / 2 + y * dh];
            }
        });
    }
    
    
    treeArrangementPosition(initialVertexPosition, root, treeEdges, x0, y0, width, height, reverse=false) {
        // build adjacency lists for the tree
        const n = this.numVertices()
        const treeNeighbours = Graph.adjacencyLists(n, treeEdges, reverse);
        return this.treeArrangementPositionNeigbours(initialVertexPosition, root, treeNeighbours, x0, y0, width, height, reverse);
    }

    treeArrangement(root, treeEdges, x0, y0, width, height, reverse=false) {
        this.vertexPosition = this.treeArrangementPosition(this.vertexPosition, root, treeEdges, x0, y0, width, height, reverse);
        this.draw();
    }

    treeArrangementNeighbours(root, treeNeighbours, x0, y0, width, height, reverse=false) {
        this.vertexPosition = this.treeArrangementPositionNeigbours(this.vertexPosition, root, treeNeighbours, x0, y0, width, height, reverse);
        this.draw();
    }
    
    forrestArrangementPosition(initialVertexPosition, roots, forestEdges, x0, y0, width, height, reverse=false) {
        // build adjacency lists for the forest
        const n = this.numVertices()
        const forrestNeighbours = Graph.adjacencyLists(n, forestEdges, reverse);

        let xStart = 0;
        let xEnd = 0;
        let yStart = 0;
        let yEnd = 0;
        const coordinates = {
            visited: Array(n).fill(false),
            coords: Array(n)
        }
        roots.forEach(root => {
            const  c = this.treeCoordinates(forrestNeighbours, root, xStart, yStart);
            for (let i = 0; i < n; i++) {
                if (c.visited[i]) {
                    coordinates.visited[i] = true;
                    coordinates.coords[i] = c.coords[i];
                }
            }
            xEnd = c.xEnd;
            xStart = c.xEnd + 1;
            yEnd = Math.max(yEnd, c.yEnd);
        });

        let dh = height / (yEnd + 1);
        let dw = width / (xEnd  + 1);
        return initialVertexPosition.map((p, vertex) => {
            if (!coordinates.visited[vertex])
                return p;
            else {
                const [x, y] = coordinates.coords[vertex];
                return [x0 + dw / 2 + x * dw, y0 + dh / 2 + y * dh];
            }
        });
    }

    forrestArrangement(roots, forestEdges, x0, y0, width, height, reverse=false) {
        this.vertexPosition = this.forrestArrangementPosition(this.vertexPosition, roots, forestEdges, x0, y0, width, height, reverse);
        this.draw();
    }
    
    shake(n) {
        this.vertexPosition = this.vertexPosition.map(p => [p[0] + Math.random() * n - n/2, p[1] + Math.random() * n - n/2])
    }

    animateArrangement(newVertexPosition, n=30, dt=500) {
        this.draw();
        let t = 0;
        const startVertexPosition = [...this.vertexPosition];
        const self = this;
        function step() {
            for (let vertex = 0; vertex < self.numVertices(); vertex++) {
                const [x0, y0] = startVertexPosition[vertex];
                const [x1, y1] = newVertexPosition[vertex];
                self.vertexPosition[vertex] = [(1-t)*x0 + t*x1, (1-t)*y0 + t*y1];
            }
            self.draw();
            t += 1 / n;
            if (t < 1)
                setTimeout(step, dt/n);
        }
        setTimeout(step, dt);
    }

    // VERTEX CONTENT

    getVertexContent(vertex) {
        if (this.vertexContent[vertex] !== undefined) {
            const str = this.vertexContent[vertex];
            if (/^-?\d+$/.test(str))
                return parseInt(str);
            else
                return str;
        } else
            return vertex;
    }

    setVertexContent(vertex, content) {
        if (this.vertexContent[vertex] === content)
            return false;
        this.vertexContent[vertex] = content;
        this.draw();
        return true;
    }

    // LABELS
    
    getVertexLabel(vertex) {
        return this.vertexLabels[vertex];
    }
    
    setVertexLabel(vertex, label) {
        if (this.vertexLabels[vertex] == label)
            return false;
        this.vertexLabels[vertex] = label;
        this.draw();
        return true;
    }

    removeVertexLabel(vertex) {
        return this.setVertexLabel(vertex, undefined);
    }

    removeAllVertexLabels() {
        for (let vertex = 0; vertex < this.numVertices(); vertex++)
            this.removeVertexLabel(vertex);
    }

    edgeKey(edge) {
        return JSON.stringify(this.graph.normalizeEdge(edge));
    }

    getEdgeLabel(edge) {
        return this.edgeLabels[this.edgeKey(edge)];
    }

    setEdgeLabel(edge, label) {
        const key = this.edgeKey(edge);
        if (this.edgeLabels[key] == label)
            return false;
        this.edgeLabels[key] = label;
        this.draw();
        return true;
    }

    removeEdgeLabel(edge) {
        return this.setEdgeLabel(edge, undefined);
    }

    getLabeledVertices() {
        const vertices = []
        for (let vertex = 0; vertex < this.numVertices(); vertex++) {
            if (this.vertexLabels[vertex] != undefined)
                vertices.push(vertex);
        }
        return vertices;
    }

    numLabeledVertices() {
        let vertices = 0;
        for (let vertex = 0; vertex < this.numVertices(); vertex++) {
            if (this.vertexLabels[vertex] != undefined)
                vertices++;
        }
        return vertices;
    }

    vertexOrderByLabel() {
        const labels = []
        for (let vertex = 0; vertex < this.numVertices(); vertex++) {
            const label = this.vertexLabels[vertex];
            if (label != undefined)
                labels.push([label, vertex]);
            labels.sort((a, b) => a[0] - b[0]);
        }
        return labels.map(x => x[1]);
    }

    setWeightLabels() {
        if (!this.graph.weighted)
            return false;
        const edges = this.graph.getWeightedEdges();
        edges.forEach(edge => this.setEdgeLabel([edge[1], edge[2]], edge[0]));
        return true;
    }

    
    // CSS
    getVertexCSS(vertex) {
        return this.vertexCSS[vertex];
    }

    getVertexCSSProperty(vertex, property) {
        const css = this.getVertexCSS(vertex);
        if (css === undefined)
            return undefined;
        return css[property];
    }

    setVertexCSS(vertex, css) {
        for (const property in css)
            this.setVertexCSSProperty(vertex, property, css[property]);
        this.draw();
    }

    setVertexCSSProperty(vertex, property, value) {
        if (this.getVertexCSS(vertex, property) == value)
            return false;
        if (!this.vertexCSS[vertex])
            this.vertexCSS[vertex] = {};
        this.vertexCSS[vertex][property] = value;
        this.draw();
        return true;
    }
    
    removeVertexCSS(vertex) {
        if (this.getVertexCSS(vertex) == undefined)
            return false;
        delete this.vertexCSS[vertex];
        this.draw();
        return true;
    }

    removeAllVertexCSS() {
        this.vertexCSS = Array(this.numVertices());
        this.draw();
    }

    getEdgeCSS(edge) {
        return this.edgeCSS[this.edgeKey(edge)];
    }

    getEdgeCSSProperty(edge, property) {
        const css = this.getEdgeCSS(edge);
        if (css === undefined)
            return undefined;
        return css[property];
    }

    setEdgeCSSProperty(edge, property, value) {
        if (this.getEdgeCSSProperty(edge, property) == value)
            return false;
        const key = this.edgeKey(edge);
        if (this.edgeCSS[key] == undefined)
            this.edgeCSS[key] = {};
        this.edgeCSS[key][property] = value;
        this.draw();
        return true;
    }
    
    setEdgeCSS(edge, css) {
        for (const property in css)
            this.setEdgeCSSProperty(edge, property, css[property]);
    }

    removeEdgeCSS(edge) {
        if (this.getEdgeCSS(edge) == undefined)
            return false;
        delete this.edgeCSS[this.edgeKey(edge)];
        this.draw();
        return true;
    }

    // set css to the vertex currently in focus
    setFocusVertexCSS(css) {
        if (this.focusVertex == undefined)
            return false;
        return this.setVertexCSS(this.focusVertex);
    }
    
    // set css to the edge currently in focus
    setFocusEdgeCSS(css) {
        if (this.focusEdge == undefined)
            return false;
        return this.setEdgeCSS(this.focusEdge);
    }

    // reset both vertex and edge css styles
    resetAllCSS() {
        this.vertexCSS = Array(this.vertexCSS.length).fill(undefined);
        this.edgeCSS = {};
        this.draw();
        return true;
    }

    // MOUSE POSITION
    
    // is point (x, y) close to the given vertex?
    closeToVertex(vertex, x, y, eps = 15) {
        const [xc, yc] = this.vertexPosition[vertex];
        return (x - xc)*(x - xc) + (y - yc)*(y - yc) <= eps * eps;
    }

    // which node lies on point (x, y)
    vertexOn(x, y) {
        const n = this.numVertices();
        for (let vertex = 0; vertex < n; vertex++)
            if (this.closeToVertex(vertex, x, y))
                return vertex;
        return undefined;
    }

    // is point (x, y) close to the given edge [vertex1, vertex2]?

    // is point (x, y) close to the given edge [vertex1, vertex2]?
    closeToEdge(edge, x, y, curvature=0) {
        if (curvature == 0) {
            var [vertex1, vertex2] = edge;
            var [x0, y0] = this.vertexPosition[vertex1];
            var [x1, y1] = this.vertexPosition[vertex2];
            
            function distance(ax, ay, bx, by) { 
                return Math.sqrt((ax - bx)*(ax - bx) + (ay - by)*(ay - by));
            }
            var eps = 1;
            return Math.abs(distance(x, y, x0, y0) + distance(x, y, x1, y1) - distance(x0, y0, x1, y1)) < eps;
        } else {
            function pointOnQuadraticCurve(x, y, P0, P1, P2, eps = 1) {
                function quadraticCurveEquation(t, P0, P1, P2) {
                    const xT = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0];
                    const yT = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1];
                    return { x: xT, y: yT };
                }
                
                const n = 50;
                const dt = 1 / n;
                let t = 0;
                for (let i = 0; i <= n; i++) {
                    t += dt;
                    const { x: xT, y: yT } = quadraticCurveEquation(t, P0, P1, P2);
                    const distance = Math.sqrt((xT - x) ** 2 + (yT - y) ** 2);
                    if (distance < eps)
                        return true;
                }
                
                return false;
            }
            var [vertex1, vertex2] = edge;
            var [x0, y0] = this.vertexPosition[vertex1];
            var [x1, y1] = this.vertexPosition[vertex2];
            var [mx, my] = [(x0 + x1) / 2, (y0 + y1) / 2];
            return pointOnQuadraticCurve(x, y, [x0, y0], [mx - curvature*(my - y0), my + curvature*(mx - x0)], [x1, y1], 5);
        }
    }
    
    // which edge lies on point (x, y)
    edgeOn(x, y) {
        return this.graph.getEdges().find(edge => {
            let curvature = this.getEdgeCSSProperty(edge, "curvature");
            if (curvature == undefined) curvature = this.CSS.edge.curvature;
            return this.closeToEdge(edge, x, y, curvature)
        });
    }

    // FOCUSING

    // focus vertex under the mouse pointer that is at (x, y)
    focusVertexOn(x, y) {
        const vertex = this.vertexOn(x, y);
        if (vertex != this.focusVertex) {
            this.focusEdge = undefined;
            this.focusVertex = vertex;
            this.draw();
            return true;
        }
        return false;
    }

    // focus edge under the mouse pointer that is at (x, y)
    focusEdgeOn(x, y) {
        if (this.vertexOn(x, y) != undefined) {
            if (!this.focusEdge)
                return false;
            
            this.focusEdge = undefined;
            return true;
        }
        const edge = this.edgeOn(x, y);
        if (edge != this.focusEdge) {
            this.focusEdge = edge;
            this.draw();
            return true;
        }
        return false;
    }

    // SELECTION

    // check if the given vertex is selected
    isSelectedVertex(vertex) {
        return this.selectedVertices.includes(vertex)
    }

    // check if the given edge is selected
    isSelectedEdge(edge) {
        for (const e of this.selectedEdges)
            if (Graph.equalEdges(e, edge))
                return true;
        return false;
    }
    
    // select a given vertex
    selectVertex(vertex) {
        if (!this.isSelectedVertex(vertex)) {
            if (this.singleSelectVertex)
                this.selectedVertices = [];
            this.selectedVertices.push(vertex);
            this.draw();
            return true;
        }
        return false;
    }

    // select a given edge
    selectEdge(edge) {
        if (!this.isSelectedEdge(edge)) {
            if (this.singleSelectEdge)
                this.selectedEdges = [];
            this.selectedEdges.push(edge);
            this.draw();
            return true;
        }
        return false;
    }

    // select vertex on given position
    selectVertexOn(x, y) {
        const vertex = this.vertexOn(x, y);
        if (vertex == undefined)
            return false;
        return this.selectVertex(vertex);
    }

    // select edge on given position
    selectEdgeOn(x, y) {
        if (this.vertexOn(x, y) != undefined)
            return false;
        const edge = this.edgeOn(x, y);
        if (edge == undefined)
            return false;
        return this.selectEdge(edge);
    }

    // select vertex currently in focus
    selectFocusVertex() {
        if (this.focusVertex)
            return this.selectVertex(this.focusVertex);
        return false;
    }

    // select edge currently in focus
    selectFocusEdge() {
        if (this.focusEdge)
            return this.selectEdge(this.focusEdge);
        return false;
    }
    
    // deselect a given vertex
    deselectVertex(vertex) {
        if (this.isSelectedVertex(vertex)) {
            this.selectedVertices = this.selectedVertices.filter(v => v !== vertex);
            this.draw();
            return true;
        }
        return false;
    }

    // deselect a given edge
    deselectEdge(edge) {
        if (this.isSelectedEdge(edge)) {
	    this.selectedEdges = this.selectedEdges.filter(e => !Graph.equalEdges(e, edge));
            this.draw();
            return true;
        }
        return false;
    }
    
    // deselect vertex currently in focus
    deselectFocusVertex() {
        if (this.focusVertex)
            return this.deselectVertex(this.focusVertex);
        return false;
    }

    // deselect edge currently in focus
    deselectFocusEdge() {
        if (this.focusEdge)
            return this.deselectEdge(this.focusEdge);
        return false;
    }

    
    // deselect all vertices
    deselectAllVertices() {
        if (this.selectedVertices != []) {
            this.selectedVertices = [];
            this.draw();
            return true;
        }
        return false;
    }

    // deselect all edges
    deselectAllEdges() {
        if (this.selectedEdges != []) {
            this.selectedEdges = [];
            this.draw();
            return true;
        }
        return false;
    }

    // deselect all vertices and edges
    deselectAll() {
        let change = false;
        change = change || this.deselectAllVertices();
        change = change || this.deselectAllEdges();
        return change;
    }    

    // deselect vertex on the given mouse position (x, y)
    deselectVertexOn(x, y) {
        const vertex = this.vertexOn(x, y);
        if (vertex == undefined)
            return false;
        return this.deselectVertex(vertex);
    }

    // deselect edge on the given mouse position (x, y)
    deselectEdgeOn(x, y) {
        const edge = this.edgeOn(x, y);
        if (edge == undefined)
            return false;
        return this.deselectEdge(edge);
    }
    
    // toggle selection of a given vertex
    toggleSelectVertex(vertex) {
        if (this.isSelectedVertex(vertex))
            this.deselectVertex(vertex);
        else
            this.selectVertex(vertex);
    }

    // toggle selection of a given edge
    toggleSelectEdge(edge) {
        if (this.isSelectedEdge(edge))
            this.deselectEdge(edge);
        else
            this.selectEdge(edge);
    }

    // toggle selection of a vertex on the given coordinates (x, y)
    toggleSelectVertexOn(x, y) {
        const vertex = this.vertexOn(x, y);
        if (vertex == undefined)
            return false;
        this.toggleSelectVertex(vertex);
        return true;
    }

    // toggle selection of an edge on the given coordinates (x, y)
    toggleSelectEdgeOn(x, y) {
        if (this.vertexOn(x, y) != undefined)
            return false;
        
        const edge = this.edgeOn(x, y);
        if (edge == undefined)
            return false;
        this.toggleSelectEdge(edge);
        return true;
    }

    
    // MOVING VERTICES

    // moves focused vertex to position (x, y)
    moveFocusVertex(x, y) {
        if (this.focusVertex != undefined) {
            this.vertexPosition[this.focusVertex] = [x, y];
            this.draw();
            return true;
        }
        return false;
    }

    // move selectedVertices to (x, y)
    moveSelectedVertices(x, y) {
        this.selectedVertices.forEach((vertex) => {
            this.vertexPosition[vertex] = [x, y];
        });
        this.draw();
    }

    // move selected vertices by (dx, dy)
    moveSelectedVerticesBy(dx, dy) {
        this.selectedVertices.forEach((vertex) => {
            const [x, y] = this.vertexPosition[vertex];
            this.vertexPosition[vertex] = [x + dx, y + dy];
        });
        this.draw();
    }

    // graph drawing
    draw() {
        if (this.canvas == undefined)
            return;
        
        function drawEdgeLine(ctx, x1, y1, x2, y2, width, color, directed, label, curvature, vertexSize1, vertexSize2) {
            var d = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
            
            ctx.save();
            ctx.translate(x2, y2);
            var alpha = Math.atan2(y2 - y1, x2 - x1);
            ctx.rotate(alpha);

            var bottomX = -d, bottomY = 0;
            var topX = 0, topY = 0;

            // draw "line"
            ctx.beginPath();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.moveTo(bottomX, bottomY);
            const midX = (bottomX + topX) / 2;
            const midY = -curvature * midX;
            ctx.quadraticCurveTo(midX, midY, topX, topY);
            ctx.stroke();

            // draw "arrow"
            if (directed) {
                if (curvature != 0) {
                    ctx.save();
                    const Cx = t => bottomX*(1-t)**2 + 2*midX*t*(1-t) + topX*t**2;
                    const Cy = t => bottomY*(1-t)**2 + 2*midY*t*(1-t) + topY*t**2;
                    const n = 200;
                    const dt = 1/n;
                    let t = 1.0;
                    for (let i = 0; i <= n; i++) {
                        t -= dt;
                        if ((Cx(t) - topX)**2 + (Cy(t) - topY)**2 > vertexSize2**2)
                            break;
                    }

                    const alpha = Math.atan2(Cy(t + dt) - Cy(t), Cx(t + dt) - Cx(t));
                    ctx.rotate(alpha);
                }

                ctx.beginPath();
                const length = 15;
                ctx.moveTo(topX - vertexSize2 - length, topY - length / 3);
                ctx.lineTo(topX - vertexSize2, topY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(topX - length - vertexSize2, topY + length / 3);
                ctx.lineTo(topX - vertexSize2, topY);
                ctx.stroke();

                if (curvature != 0)
                    ctx.restore();
            }

            // print weight
            if (label !== undefined) {
                ctx.font = "15px Arial";
                ctx.translate((bottomX + topX) / 2, (bottomY + topY) / 2);
                ctx.rotate(-alpha);
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, 2*Math.PI);
                ctx.fill();
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
                ctx.fillText(label, 10, 10);
            }
            
            ctx.restore();
        }

        function drawEdgeLoop(ctx, x, y, width, color, label) {
            ctx.beginPath();
            ctx.ellipse(x, y - 10, 10, 15, Math.PI, 0, 2*Math.PI);
            ctx.stroke();
        }

        function drawVertexCircle(ctx, x, y, size, color, fontFamily, fontSize, content, label, labelSize, labelColor, labelBackground) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = fontSize + " " + fontFamily;
            ctx.fillStyle = hsvColor(color).v >= 0.6 ? "black" : "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(content, x, y);
            if (label !== undefined) {
                ctx.save();
                ctx.font = labelSize + " " + fontFamily;
                ctx.fillStyle = labelColor;

                const x0 = x + 25, y0 = y - 15;

                if (labelBackground) {
                    const padding = 2;
                    const textWidth = ctx.measureText(label).width + padding + 2;
                    const textHeight = parseInt(labelSize) + padding;
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = "#ddd";
                    ctx.fillRect(x0 - textWidth / 2, y0 - textHeight / 2, textWidth, textHeight);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = labelColor;
                    ctx.strokeRect(x0 - textWidth / 2, y0 - textHeight / 2, textWidth, textHeight);
                }
                
                ctx.fillStyle = labelColor;
                ctx.fillText(label, x0, y0);
		ctx.restore();
            }
        }

        const self = this;
        function drawEdge(ctx, edge, css, vertexCSS1, vertexCSS2) {
            const [vertex1, vertex2] = edge;
            if (css == undefined)
                css = self.CSS.edge;
            if (vertexCSS1 == undefined)
                vertexCSS1 = self.CSS.vertex;
            if (vertexCSS2 == undefined)
                vertexCSS2 = self.CSS.vertex;
            
	    const width = "width" in css ? css.width : self.CSS.edge.width;
	    const color = "color" in css ? css.color : self.CSS.edge.color;
	    const curvature = "curvature" in css ? css.curvature : self.CSS.edge.curvature;
            
            if (vertex1 != vertex2) {
                const [x1, y1] = self.vertexPosition[vertex1];
                const [x2, y2] = self.vertexPosition[vertex2];
                const label = self.getEdgeLabel(edge);
                const vertexSize1 = "size" in vertexCSS1 ? vertexCSS1["size"] : self.CSS.vertex.size;
                const vertexSize2 = "size" in vertexCSS2 ? vertexCSS1["size"] : self.CSS.vertex.size;
                
                drawEdgeLine(ctx, x1, y1, x2, y2, width, color, self.graph.directed, label, curvature, vertexSize1, vertexSize2);
            } else {
                const [x, y] = self.vertexPosition[vertex1];
                const label = self.getEdgeLabel(edge);
                const vertexSize =  "size" in vertexCSS1 ? vertexCSS1["size"] : self.CSS.vertex.size;
                drawEdgeLoop(ctx, x, y, width, color, label, vertexSize);
            }
        }

        function drawVertex(ctx, vertex, css) {
            if (css == undefined)
                css = self.CSS.vertex;
            const [x, y] = self.vertexPosition[vertex];
	    const color = "color" in css ? css.color : self.CSS.vertex.color;
	    const size = "size" in css ? css.size : self.CSS.vertex.size;
            const fontFamily = "fontFamily" in css ? css.fontFamily : self.CSS.vertex.fontFamily;
            const fontSize = "fontSize" in css ? css.fontSize : self.CSS.vertex.fontSize;
            const label = self.vertexLabels[vertex];
            const content = self.getVertexContent(vertex);
            const labelSize = "labelSize" in css ? css.labelSize : self.CSS.vertex.labelSize;
            const labelColor = "labelColor" in css ? css.labelColor : self.CSS.vertex.labelColor;
            const labelBackground = "labelBackground" in css ? css.labelBackground : self.CSS.vertex.labelBackground;
            
            drawVertexCircle(ctx, x, y, size, color, fontFamily, fontSize, content, label, labelSize, labelColor, labelBackground);
        }

        const ctx = this.canvas.ctx();
        ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

        // draw edges that are not in focus
        this.graph.getEdges().forEach(edge => {
            if (!Graph.equalEdges(this.focusEdge, edge)) {
                const edgeCSS = this.getEdgeCSS(edge);
                const [v1, v2] = edge;
                const vertexCSS1 = this.getVertexCSS(v1);
                const vertexCSS2 = this.getVertexCSS(v2);
                drawEdge(ctx, edge, edgeCSS, vertexCSS1, vertexCSS2);
            }
        });

        // draw focus edge
        if (this.focusEdge != undefined) {
            const css = {...this.getEdgeCSS(this.focusEdge)};
            for (const property in this.CSS.focusEdge)
                css[property] = this.CSS.focusEdge[property];
            const [v1, v2] = this.focusEdge;
            const vertexCSS1 = this.getVertexCSS(v1);
            const vertexCSS2 = this.getVertexCSS(v2);
            drawEdge(ctx, this.focusEdge, css, vertexCSS1, vertexCSS2);
        }
        
        // draw vertices that are not in focus
        for (let vertex = 0; vertex < this.numVertices(); vertex++)
            if (vertex != this.focusVertex) {
                const css = this.vertexCSS[vertex] ? this.vertexCSS[vertex] : this.CSS.vertex;
                drawVertex(ctx, vertex, css);
            }
        
        // draw focus vertex
        if (this.focusVertex != undefined) {
            const css = {...this.getVertexCSS(this.focusVertex)};
            for (const property in this.CSS.focusVertex)
                css[property] = this.CSS.focusVertex[property];
            drawVertex(ctx, this.focusVertex, css);
        }
        
        // draw selected vertices
        this.selectedVertices.forEach(vertex => {
            const css = {...this.getVertexCSS(vertex)};
            for (const property in this.CSS.selectedVertex)
                css[property] = this.CSS.selectVertex[property];
            drawVertex(ctx, vertex, css)
        });

        // draw selected edges
        this.selectedEdges.forEach(edge => {
            const css = {...this.getEdgeCSS(edge)};
            for (const property in this.CSS.selectedEdge)
                css[property] = this.CSS.selectedEdge[property];
            drawEdge(ctx, edge, css);
        });
    }

    onVertexEvent(event, handler) {
        const self = this;
        this.canvas.addEventListener(event, function(e) {
            const vertex = self.vertexOn(e.offsetX, e.offsetY);
            if (vertex != undefined)
                handler(vertex, e);
        });
    }

    onVertexClick(handler) {
        this.onVertexEvent("click", handler);
    }

    onVertexDblClick(handler) {
        this.onVertexEvent("dblclick", handler);
    }

    onEdgeEvent(event, handler) {
        const self = this;
        this.canvas.addEventListener(event, function(e) {
            const edge = self.edgeOn(e.offsetX, e.offsetY);
            if (edge != undefined)
                handler(edge);
        });
    }

    onEdgeClick(handler) {
        this.onEdgeEvent("click", handler);
    }

    onEdgeDblClick(handler) {
        this.onEdgeEvent("dblclick", handler);
    }

    selectVerticesOnClick() {
        var self = this;
        this.onVertexClick(function(vertex) {
            self.toggleSelectVertex(vertex);
        });
    }

    selectEdgesOnClick() {
        const self = this;
        this.onEdgeClick(function(edge) {
            self.toggleSelectEdge(edge);
        });
    }

    selectVerticesOnDblClick() {
        const self = this;
        this.onVertexDblClick(function(vertex) {
            self.toggleSelectVertex(vertex);
        });
    }

    selectEdgesOnDblClick() {
        const self = this;
        this.onEdgeDblClick(function(edge) {
            self.toggleSelectEdge(edge);
        });
    }

    showFocusVertex() {
        const self = this;
        this.canvas.addEventListener("mousemove", function(e) {
            self.focusVertexOn(e.offsetX, e.offsetY);
        });
    }

    showFocusEdge() {
        const self = this;
        this.canvas.addEventListener("mousemove", function(e) {
            self.focusEdgeOn(e.offsetX, e.offsetY);
        });
    }

    dragFocusVertex() {
        const self = this;
        let mouseDown = false;
        let downTime;
        this.canvas.addEventListener("mousedown", function(e) {
            if (e.button == 0) {
                mouseDown = true;
                downTime = Date.now();
            }
        });
        
        this.canvas.addEventListener("mousemove", function(e) {
            if (mouseDown && Date.now() - downTime > 100)
                self.moveFocusVertex(e.offsetX, e.offsetY);
        });

        this.canvas.addEventListener("mouseup", function(e) {
            mouseDown = false;
        });
    }

    orderVerticesDblClick(start=0) {
        const self = this;
        this.onVertexDblClick(function(vertex) {
            if (self.getVertexLabel(vertex) == undefined)
                self.setVertexLabel(vertex, self.numLabeledVertices() + start);
            else if (self.getVertexLabel(vertex) == self.numLabeledVertices() + start - 1) {
                self.removeVertexLabel(vertex);
            }
        });
    }

    editValueOnClick() {
        const self = this;
        this.onVertexClick(function(vertex) {
            const input = document.createElement("input");
            input.type = "text";
            input.style.position = 'fixed';
            const [x, y] = self.vertexPosition[vertex];
            const canvasRect = self.canvas.getBoundingClientRect();
            input.style.textAlign = "center";
            input.style.width = 30 + "px";
            input.style.height = 20 + "px";
            input.style.left = canvasRect.left + x - 18 + 'px';
            input.style.top = canvasRect.top + y - 12 + 'px';
            document.body.appendChild(input);
            input.focus();
            input.onblur = function() {
                self.setVertexContent(vertex, input.value);
                document.body.removeChild(input);
            }
        });
    }

    setCSS() {
        this.CSS = {
            edge: {
                width: 1,
                color: "black",
                curvature: 0
            },
            
            vertex: {
                color: "white",
                size: 15,
                fontFamily: "Arial",
                fontSize: "15px",
                labelSize: "13px",
                labelColor: "black",
                labelBackground: false
            },

            focusEdge: {
                color: "#bbbbbb"
            },

            focusVertex: {
                color: "#cccccc"
            },
            
            selectedVertex: {
                color: "#9999ff"
            },

            selectedEdge: {
                width: 2,
                color: "red"
            }
        }
    }
}

export class CommandSetEdgeCSS {
    constructor(graphDrawing, edge, css) {
        this.graphDrawing = graphDrawing;
        this.edge = edge;
        this.css = css;
    }

    doCommand() {
        this.undo = {...this.graphDrawing.getEdgeCSS(this.edge)};
        this.graphDrawing.setEdgeCSS(this.edge, this.css);
    }

    undoCommand() {
        this.graphDrawing.removeEdgeCSS(this.edge);
        if (this.undo != undefined)
            this.graphDrawing.setEdgeCSS(this.edge, this.undo);
    }
}

export class CommandResetAllVertexCSS {
    constructor(graphDrawing) {
        this.graphDrawing = graphDrawing;
    }

    doCommand() {
        this.undo = new Array(this.graphDrawing.numVertices());
        for (let v = 0; v < this.graphDrawing.numVertices(); v++) {
            this.undo[v] = this.graphDrawing.getVertexCSS(v);
            this.graphDrawing.removeVertexCSS(v);
        }
    }

    undoCommand() {
        for (let v = 0; v < this.graphDrawing.numVertices(); v++)
            this.graphDrawing.setVertexCSS(v, this.undo[v]);
    }
}

export class CommandSetVertexCSS {
    constructor(graphDrawing, vertex, css) {
        this.graphDrawing = graphDrawing;
        this.vertex = vertex;
        this.css = css;
    }

    doCommand() {
        this.undo = {...this.graphDrawing.getVertexCSS(this.vertex)};
        this.graphDrawing.setVertexCSS(this.vertex, this.css);
    }

    undoCommand() {
        this.graphDrawing.removeVertexCSS(this.vertex);
        this.graphDrawing.setVertexCSS(this.vertex, this.undo);
    }
}

export class CommandSetVertexLabel {
    constructor(graphDrawing, vertex, label) {
        this.graphDrawing = graphDrawing;
        this.vertex = vertex;
        this.label = label;
    }

    doCommand() {
        this.undo = this.graphDrawing.getVertexLabel(this.vertex);
        this.graphDrawing.setVertexLabel(this.vertex, this.label);
    }

    undoCommand() {
        this.graphDrawing.setVertexLabel(this.vertex, this.undo);
    }
}

export class CommandSetVertexContent {
    constructor(graphDrawing, vertex, content) {
        this.graphDrawing = graphDrawing;
        this.vertex = vertex;
        this.content = content;
    }

    doCommand() {
        this.undo = this.graphDrawing.getVertexContent(this.vertex);
        this.graphDrawing.setVertexContent(this.vertex, this.content);
    }

    undoCommand() {
        this.graphDrawing.setVertexContent(this.vertex, this.undo);
    }
}

import { Commands } from './commands.js';

export class GraphCommands extends Commands {
    constructor(commands) {
        super(commands);
    }
}
