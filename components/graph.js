export class Graph {
    constructor(n=0, directed=true) {
        this.directed = directed;
        this.weighted = false;
        this.emptyGraph(n);
    }

    numVertices() {
        return this.neighbours.length;
    }

    addEdge(i, j) {
        this.neighbours[i].push(j);
        if (!this.directed)
            this.neighbours[j].push(i);
    }

    hasEdge(i, j) {
        return this.neighbours[i].includes(j);
    }

    getNeighbours(i) {
        return this.neighbours[i];
    }

    emptyGraph(n) {
        this.neighbours = Array.from({length: n}, () => []);
    }

    sortNeighbours() {
        for (let i = 0; i < this.neighbours.length; i++)
            this.neighbours[i].sort();
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

    latticeGraph(m, n) {
        function vertex(i, j) {
            return i * n + j;
        }

        this.emptyGraph(m * n);

        for (let i = 0; i < m; i++)
            for (let j = 1; j < n; j++)
                this.addEdge(vertex(i, j-1), vertex(i, j));

        for (let j = 0; j < n; j++)
            for (let i = 1; i < m; i++)
                this.addEdge(vertex(i-1, j), vertex(i, j));
        this.sortNeighbours();
    }


    dfs(vertex=0) {
        const self = this;
        const visited = new Array(this.numVertices()).fill(false);
        const trace = []
        dfsRec(vertex);
        function dfsRec(vertex) {
            if (visited[vertex])
                return;
            visited[vertex] = true;
            self.neighbours[vertex].forEach(neighbour => {
                if (!visited[neighbour]) {
                    trace.push([vertex, neighbour]);
                    dfsRec(neighbour);
                    trace.push([vertex]);
                }
            });
        }
        return trace;
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

    addEventListener(event, handler) {
        this._canvas.addEventListener(event, handler);
    }
}

export class GraphDrawing {
    constructor(graph, canvas) {
        this.graph = graph;
        
        const n = graph.numVertices();
        
        this.vertexPosition = Array.from({length: n}, () => [0, 0]);
        
        this.vertexLabels = Array.from({length: n}, () => undefined);
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
    }

    setPosition(i, pos) {
        this.vertexPosition[i] = pos;
    }

    getPosition(i) {
        return this.vertexPosition[i];
    }

    circularArrangement(cx, cy, r) {
        const n = this.graph.numVertices();
        
        function position(vertex) {
            const alpha = Math.PI / 2 + vertex * (2*Math.PI / n);
            const x = cx + r * Math.cos(alpha);
            const y = cy - r * Math.sin(alpha);
            return [x, y];
        }
        
        this.vertexPosition = [...Array(n).keys()].map(vertex => position(vertex));
        this.draw();
    }

    latticeArrangement(m, n, x0, y0, width, height) {
        function position(vertex, m, n) {
            const j = vertex % n;
            const i = Math.floor(vertex / n);
            const w = width / (n-1), h = height / (m-1);
            const x = x0 + j * w;
            const y = y0 + i * h;
            return [x, y];
        }
        this.vertexPosition = [...Array(this.graph.numVertices()).keys()].map(vertex => position(vertex, m, n));
        this.draw();
    }

    treeArrangement(treeEdges, width, height) {
        const self = this;
        // start from a circular vertex arrangment
        this.circularArrangement(width/2, height/2, Math.min(width/2, height/2));
        
        // gradimo liste susedstva DFS drveta
        const n = this.graph.numVertices()
        const treeNeighbours = [...Array(n)].map(i => []);
        treeEdges.forEach(edge => {
            const [a, b] = edge;
            treeNeighbours[a].push(b);
        });

        // we arrange the tree recursively
        // visited nodes during tree traversal
        const visited = new Array(n).fill(false);
        // maximal dept of a tree node
        let maxDepth = 0;
        
        // we draw the tree rooted at the given depth on a coordinate xStart
        // and return the x coordinate where its next sibling on that depth should be
        function positionRec(vertex, depth, xStart) {
            visited[vertex] = true;
            if (depth > maxDepth)
                maxDepth = depth;
            let x = xStart;
            treeNeighbours[vertex].forEach(neighbour => {
                x = positionRec(neighbour, depth+1, x);
            });
            self.vertexPosition[vertex][1] = depth;
            if (treeNeighbours[vertex].length == 0) {
                self.vertexPosition[vertex][0] = xStart;
                return xStart+1;
            } else {
                self.vertexPosition[vertex][0] = (x + xStart - 1) / 2;
                return x;
            }
        }

        const xStart = 0;
        const xEnd = positionRec(0, 0, xStart) - 1;
        let dh = height / (maxDepth + 1);
        let dw = width / (xEnd - xStart + 1);
        this.vertexPosition = this.vertexPosition.map((p, i) => {
            let [x, y] = p;
            if (visited[i]) {
                x = dw / 2 + x * dw;
                y = dh / 2 + y * dh;
            }
            return [x, y];
        });
        this.draw();
    }


    shake(n) {
        this.vertexPosition = this.vertexPosition.map(p => [p[0] + Math.random() * n - n/2, p[1] + Math.random() * n - n/2])
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
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++)
            this.removeVertexLabel(vertex);
    }

    getEdgeLabel(edge) {
        return this.edgeLabels[edge];
    }

    setEdgeLabel(edge, label) {
        if (!this.graph.directed)
            edge.sort((a, b) => a - b);
        if (this.edgeLabels[edge] == label)
            return false;
        this.edgeLabels[edge] = label;
        this.draw();
        return true;
    }

    removeEdgeLabel(edge) {
        return this.setEdgeLabel(edge, undefined);
    }

    getLabeledVertices() {
        const vertices = []
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++) {
            if (this.vertexLabels[vertex] != undefined)
                vertices.push(vertex);
        }
        return vertices;
    }

    numLabeledVertices() {
        let vertices = 0;
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++) {
            if (this.vertexLabels[vertex] != undefined)
                vertices++;
        }
        return vertices;
    }

    vertexOrderByLabel() {
        const labels = []
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++) {
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

    setVertexCSS(vertex, css) {
        if (this.vertexCSS[vertex] == css)
            return false;
        this.vertexCSS[vertex] = css;
        this.draw();
        return true;
    }

    removeVertexCSS(vertex) {
        return this.setVertexCSS(vertex, undefined);
    }

    getEdgeCSS(edge) {
        return this.edgeCSS[edge];
    }
    
    setEdgeCSS(edge, css) {
        if (!this.graph.directed)
            edge.sort((a, b) => a - b) ;
        if (this.edgeCSS[edge] == css)
            return false;
        this.edgeCSS[edge] = css;
        this.draw();
        return true;
    }

    removeEdgeCSS(edge) {
        if (this.edgeCSS[edge] == undefined)
            return false;
        delete this.edgeCSS[edge];
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
        this.edgeCSS = [];
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
        const n = this.graph.numVertices();
        for (let vertex = 0; vertex < n; vertex++)
            if (this.closeToVertex(vertex, x, y))
                return vertex;
        return undefined;
    }

    // is point (x, y) close to the given edge [vertex1, vertex2]?
    closeToEdge(edge, x, y) {
        var [vertex1, vertex2] = edge;
        var [x0, y0] = this.vertexPosition[vertex1];
        var [x1, y1] = this.vertexPosition[vertex2];
        function distance(ax, ay, bx, by) { 
            return Math.sqrt((ax - bx)*(ax - bx) + (ay - by)*(ay - by));
        }
        var eps = 1;
        return Math.abs(distance(x, y, x0, y0) + distance(x, y, x1, y1) - distance(x0, y0, x1, y1)) < eps;
    }
    
    // which edge lies on point (x, y)
    edgeOn(x, y) {
        const n = this.graph.numVertices();
        let result = undefined;
        for (let vertex = 0; vertex < n; vertex++)
            this.graph.getNeighbours(vertex).forEach(neighbour => {
                const edge = [vertex, neighbour];
                if (this.closeToEdge(edge, x, y))
                    result = edge;
            });
        return result;
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
            if (this.equalEdges(e, edge))
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
	    this.selectedEdges = this.selectedEdges.filter(e => !this.equalEdges(e, edge));
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

    // auxiliary function -- check if two edges are equal
    equalEdges(g1, g2) {
        if (!g1 || !g2)
            return false;
        var [a1, b1] = g1;
        var [a2, b2] = g2;
        return a1 == a2 && b1 == b2;
    }

    // graph drawing
    draw() {
        if (this.canvas == undefined)
            return;
        
        function drawEdgeLine(ctx, x1, y1, x2, y2, width, color, directed, label) {
            var d = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
            
            ctx.save();
            ctx.translate(x1, y1);
            var alpha = Math.atan2(y2 - y1, x2 - x1);
            ctx.rotate(alpha);

            var r = 15;
            var bottomX = r, bottomY = 0;
            var topX = d - r, topY = 0;

            // draw line
            ctx.beginPath();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.moveTo(bottomX, bottomY);
            ctx.lineTo(topX, topY);
            ctx.stroke();

            // draw "arrow"
            if (directed) {
                ctx.beginPath();
                ctx.moveTo(topX - r, topY - 5);
                ctx.lineTo(topX, topY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(topX - r, topY + 5);
                ctx.lineTo(topX, topY);
                ctx.stroke();
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

        function drawVertexCircle(ctx, x, y, color, vertex, label) {
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.font = "15px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(vertex, x, y);
            if (label !== undefined) {
                ctx.save();
                ctx.fillStyle = "red";
                ctx.fillText(label, x + 25, y - 15);
		ctx.restore();
            }
        }

        const self = this;
        function drawEdge(ctx, edge, css) {
            const [vertex1, vertex2] = edge;
            if (css == undefined)
                css = self.CSS().defaultEdge;
	    const width = "width" in css ? css.width : self.CSS().defaultEdge.width;
	    const color = "color" in css ? css.color : self.CSS().defaultEdge.color;
            const [x1, y1] = self.vertexPosition[vertex1];
            const [x2, y2] = self.vertexPosition[vertex2];
            const label = self.edgeLabels[edge];
            drawEdgeLine(ctx, x1, y1, x2, y2, width, color, self.graph.directed, label);
        }

        function drawVertex(ctx, vertex, css) {
            if (css == undefined)
                css = self.CSS().defaultVertex;
            const [x, y] = self.vertexPosition[vertex];
	    const color = "color" in css ? css.color : self.CSS().defaultVertex.color;
            const label = self.vertexLabels[vertex];
            drawVertexCircle(ctx, x, y, color, vertex, label);
        }

        const ctx = this.canvas.ctx();
        ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

        // draw edges that are not in focus
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++) {
            this.graph.neighbours[vertex].forEach(neighbour => {
                var edge = [vertex, neighbour];
                if (this.graph.directed || vertex <= neighbour) {
                    if (!this.equalEdges(this.focusEdge, edge))
                        drawEdge(ctx, edge, this.edgeCSS[edge]);
                }
            });
        }

        // draw focus edge
        if (this.focusEdge != undefined) {
            drawEdge(ctx, this.focusEdge, this.CSS().focusEdge);
        }
        
        // draw vertices that are not in focus
        for (let vertex = 0; vertex < this.graph.numVertices(); vertex++)
            if (vertex != this.focusVertex) {
                const css = this.vertexCSS[vertex] ? this.vertexCSS[vertex] : this.CSS().defaultVertex;
                drawVertex(ctx, vertex, css);
            }
        
        // draw focus vertex
        if (this.focusVertex != undefined) {
            drawVertex(ctx, this.focusVertex, this.CSS().focusVertex);
        }
        
        // draw selected vertices
        this.selectedVertices.forEach(vertex => {
            drawVertex(ctx, vertex, this.CSS().selectedVertex)
        });

        // draw selected edges
        this.selectedEdges.forEach(edge => {
            drawEdge(ctx, edge, this.CSS().selectedEdge);
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

    selectVerticesOnClick() {
        const self = this;
        this.canvas.addEventListener("mousedown", function(e) {
            self.toggleSelectVertexOn(e.offsetX, e.offsetY);
        });
    }

    selectEdgesOnClick() {
        const self = this;
        this.canvas.addEventListener("mousedown", function(e) {
            self.toggleSelectEdgeOn(e.offsetX, e.offsetY);
        });
    }

    selectVerticesOnDblClick() {
        const self = this;
        this.canvas.addEventListener("dblclick", function(e) {
            self.toggleSelectVertexOn(e.offsetX, e.offsetY);
        });
    }

    selectEdgesOnDblClick() {
        const self = this;
        this.canvas.addEventListener("dblclick", function(e) {
            self.toggleSelectEdgeOn(e.offsetX, e.offsetY);
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

    vertexEvent(event, handler) {
        const self = this;
        this.canvas.addEventListener(event, function(e) {
            const vertex = self.vertexOn(e.offsetX, e.offsetY);
            if (vertex != undefined)
                handler(vertex);
        });
    }

    vertexClick(handler) {
        this.vertexEvent("click", handler);
    }

    vertexDblClick(handler) {
        this.vertexEvent("dblclick", handler);
    }

    orderVerticesDblClick(start=0, onDblClick=null) {
        const self = this;
        this.vertexDblClick(function(vertex) {
            if (self.getVertexLabel(vertex) == undefined)
                self.setVertexLabel(vertex, self.numLabeledVertices() + start);
            else if (self.getVertexLabel(vertex) == self.numLabeledVertices() + start - 1) {
                self.removeVertexLabel(vertex);
            }
            if (onDblClick != null)
                onDblClick(vertex);
        });
    }
    
    CSS() {
        return {
            defaultEdge: {
                width: 1,
                color: "black"
            },
            
            defaultVertex: {
                color: "white"
            },

            focusEdge: {
                width: 1,
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
        this.undo = this.graphDrawing.getEdgeCSS(this.edge);
        this.graphDrawing.setEdgeCSS(this.edge, this.css);
    }

    undoCommand() {
        this.graphDrawing.setEdgeCSS(this.edge, this.undo);
    }
}

export class CommandSetVertexCSS {
    constructor(graphDrawing, vertex, css) {
        this.graphDrawing = graphDrawing;
        this.vertex = vertex;
        this.css = css;
    }

    doCommand() {
        this.undo = this.graphDrawing.getVertexCSS(this.vertex);
        this.graphDrawing.setVertexCSS(this.vertex, this.css);
    }

    undoCommand() {
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

export class GraphCommands {
    constructor(commands) {
        this.commands = commands;
        this.current = 0;
    }

    reset() {
        while (this.inProgres()) {
            this.current--;
            this.undoCurrentCommand();
        }
    }

    inProgres() {
        return this.current > 0;
    }

    done() {
        return this.current >= this.commands.length;
    }

    next() {
        if (this.done())
            return false;
        this.doCurrentCommand();
        this.current++;
        return true;
    }

    doCurrentCommand() {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].forEach(command => command.doCommand());
        else
            this.commands[this.current].doCommand();
    }

    undoCurrentCommand() {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].forEach(command => command.undoCommand());
        else
            this.commands[this.current].undoCommand();
    }

    previous() {
        if (this.current == 0)
            return false;
        --this.current;
        this.undoCurrentCommand();
        return true;
    }

    run() {
        while (!this.done()) {
            this.doCurrentCommand();
            this.current++;
        }
    }
}
