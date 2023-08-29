import { hsvColor } from './colors.js';
import { shuffle, random, render } from './util.js';
import { UnionFind } from './union_find.js';

function distance(ax, ay, bx, by) { 
    return Math.sqrt((ax - bx)*(ax - bx) + (ay - by)*(ay - by));
}

export class Graph {
    constructor(directed=true, n=0) {
        this.directed = directed;
        this.weighted = false;
        this.emptyGraph(n);
    }

    static directed(n=0) {
        return new Graph(true, n);
    }

    static undirected(n=0) {
        return new Graph(false, n);
    }
    
    numVertices() {
        return this.neighbours.length;
    }

    numEdges() {
        return this.getEdges().length;
    }

    getVertices() {
        return Array.from({ length: this.numVertices()}, (_, index) => index);
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

    addEdges(edges) {
        edges.forEach(edge => this.addEdge(...edge));
    }

    addEdgesStr(edges) {
        function toNumber(input) {
            if (/^\d+$/.test(input)) {
                return parseInt(input);
            } else if (/^[A-Z]$/.test(input)) {
                return input.charCodeAt(0) - 'A'.charCodeAt(0);
            }
        }
        const pairs = edges.split(',').map(pair => pair.split('-'));
        for (const pair of pairs) {
            const [from, to] = pair;
            this.addEdge(toNumber(from), toNumber(to));
        }
    }

    getEdges() {
        if (this.directed)
            return this.neighbours.map((ns, v) => ns.map(n => [v, n])).flat(1);
        else
            return this.neighbours.map((ns, v) => ns.map(n => [v, n])).flat(1).filter(edge => edge[0] <= edge[1]);
    }

    // in undirected graphs, edges are sorted, and in directed graphs edges are unchanged
    normalizeEdge(edge) {
        if (!this.directed && edge[0] > edge[1])
            return [edge[1], edge[0]];
        return edge;
    }

    getNeighbours(i) {
        return this.neighbours[i];
    }

    sortNeighbours() {
        for (let i = 0; i < this.neighbours.length; i++)
            this.neighbours[i].sort((a, b) => a-b);
    }

    degree() {
        return this.neighbours.map(n => n.length);
    }

    outdegree() {
        return this.neighbours.map(n => n.length);
    }

    indegree() {
        const indeg = new Array(this.numVertices()).fill(0);
        this.neighbours.forEach(n => n.forEach(v => indeg[v]++));
        return indeg;
    }

    // GENERATING GRAPHS

    // graph with no edges
    emptyGraph(n) {
        this.neighbours = Array.from({length: n}, () => []);
    }

    // all edges of a full graph (without loops)
    static fullGraphEdges(n, directed=false) {
        const edges = [];
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
                if (i == j) continue;
                if (i < j || directed)
                    edges.push([i, j]);
            }
        return edges;
    }

    // full graph with all possible edges
    fullGraph(numVertices) {
        if (numVertices === undefined)
            numVertices = this.numVertices();
        this.emptyGraph(numVertices);
        this.addEdges(Graph.fullGraphEdges(numVertices, this.directed));
        this.sortNeighbours();
    }

    // random graph with numVertices vertices, numEdges edges and
    // edges chosen from a given set of edges
    randomSubgraph(numVertices, numEdges, edges) {
        this.emptyGraph(numVertices);
        shuffle(edges);
        this.addEdges(edges.slice(0, numEdges));
        this.sortNeighbours();
    }

    // random graph with numVertices vertices and numEdges edges
    randomGraph(numVertices, numEdges) {
        const edges = Graph.fullGraphEdges(numVertices, this.directed);
        this.randomSubgraph(numVertices, numEdges, edges);
    }

    // random graph with numComponents connected components where
    // each component has between 1 and maxComponent vertices
    randomDisconnectedGraph(numComponents, maxComponent) {
        const card = new Array(numComponents);
        for (let i = 0; i < numComponents; i++)
            card[i] = 1 + random(maxComponent - 1);
        let prefixSums = new Array(numComponents+1);
        prefixSums[0] = 0;
        for (let i = 1; i <= numComponents; i++)
            prefixSums[i] = prefixSums[i-1] + card[i-1];
        const numVertices = prefixSums[prefixSums.length - 1];
        this.emptyGraph(numVertices);
        const vertices = Array.from({ length: numVertices}, (_, index) => index);
        shuffle(vertices);
        for (let c = 0; c < numComponents; c++) {
            const n = card[c];
            const component = new Graph(false);
            component.randomConnectedGraph(n, random(n-1, 2*n));
            for (const edge of component.getEdges()) {
                const [from, to] = edge;
                this.addEdge(vertices[prefixSums[c] + from], vertices[prefixSums[c] + to]);
            }
        }
    }
    
    // random tree edges with numVertices vertices and edges chosen from the given set of edges
    static randomSubtree(numVertices, edges) {
        const treeEdges = [];
        const unionFind = new UnionFind(numVertices);

        if (edges === undefined)
            edges = Graph.fullGraphEdges(numVertices, false);

        shuffle(edges);

        for (const [nodeA, nodeB] of edges) {
            if (unionFind.union(nodeA, nodeB))
                treeEdges.push([nodeA, nodeB]);
            if (treeEdges.length == numVertices - 1)
                break;
        }
        return treeEdges;
    }

    // orient edges of a tree from its root to its leaves
    static orientTreeEdges(edges, root) {
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

    
    // random connected graph with numVertices vertices, numEdges
    // edges, and edges chosen from a given list of edges
    randomConnectedSubgraph(numVertices, numEdges, edges) {
        this.emptyGraph(numVertices);
        const treeEdges = Graph.orientTreeEdges(Graph.randomSubtree(numVertices, edges), 0);
        const remainingEdges = edges.filter(edge => !treeEdges.some(edge1 => Graph.equalEdges(edge, edge1, false)));
        this.addEdges(treeEdges);
        this.addEdges(remainingEdges.slice(0, numEdges - treeEdges.length));
        this.sortNeighbours();
    }

    // random connected graph with numVertices vertices and numEdges edges
    randomConnectedGraph(numVertices, numEdges) {
        const allEdges = Graph.fullGraphEdges(numVertices, false);
        this.randomConnectedSubgraph(numVertices, numEdges, allEdges);
    }

    // random DAG (directed acyclic graph) with numVertices vertices and numEdges edges
    randomDAG(numVertices, numEdges) {
        this.emptyGraph(numVertices);
        const vertices = Array.from({ length: numVertices - 1}, (_, index) => index + 1);
        shuffle(vertices);
        vertices.unshift(0);
        let i = 0;
        while (i < numEdges) {
            let source, target;
            source = random(numVertices - 2);
            target = random(source + 1, numVertices - 1);
            if (!this.hasEdge(vertices[source], vertices[target])) {
                this.addEdge(vertices[source], vertices[target]);
                i++;
            }
        }
    }

    // random connected DAG (directed acyclic graph) with numVertices vertices and numEdges edges
    randomConnectedDAG(numVertices, numEdges) {
        this.emptyGraph(numVertices);
        const tree = Graph.directed(numVertices);
        const treeEdges = Graph.orientTreeEdges(Graph.randomSubtree(this.numVertices()), 0);
        tree.addEdges(treeEdges);
        this.addEdges(treeEdges);

        const preorder = tree.dfsPreorderNumeration(0);
        const vertices = new Array(numVertices);
        for (let i = 0; i < numVertices; i++)
            vertices[preorder[i]] = i;
        
        let i = 0;
        while (i <= numEdges - numVertices) {
            let source, target;
            source = random(numVertices - 2);
            target = random(source + 1, numVertices - 1);
            if (!this.hasEdge(vertices[source], vertices[target])) {
                this.addEdge(vertices[source], vertices[target]);
                i++;
            }
        }
    }

    // random Euler graph (a graph that has an Euler path)
    randomEulerGraph(numVertices) {
        this.emptyGraph(numVertices);
        const visited = new Array(numVertices).fill(false);
        let numVisited = 0;
        let prev = 0;
        visited[prev] = 0;
        while(true) {
            const next = random(0, numVertices - 1);
            if (next == prev) continue;
            if (this.hasEdge(prev, next) ||
                this.hasEdge(next, prev))
                continue;
            this.addEdge(prev, next);
            if (!visited[next]) {
                visited[next] = true;
                numVisited++;
            }
            prev = next;
            if (numVisited == numVertices) {
                if (prev != 0)
                    this.addEdge(prev, 0);
                break;
            }
        }
    }


    // all edges of m by n lattice graph
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

    // full m by n lattice graph
    latticeGraph(m, n, diagonals=false) {
        this.emptyGraph(m * n);
        const edges = Graph.latticeGraphEdges(m, n, diagonals);
        this.addEdges(edges);
        this.sortNeighbours();
    }

    // a random subgraph of m by n lattice graph with numEdges edges
    randomLatticeGraph(m, n, numEdges, diagonals=true) {
        const edges = Graph.latticeGraphEdges(m, n, diagonals);
        this.randomSubgraph(m * n, numEdges, edges);
    }

    // a random connected random subgraph of m by n lattice graph with numEdges edges
    randomConnectedLatticeGraph(m, n, numEdges, diagonals=true) {
        const edges = Graph.latticeGraphEdges(m, n, diagonals);
        this.randomConnectedSubgraph(m * n, numEdges, edges);
    }

    // a random strongly connected graph
    randomStronglyConnected(numVertices, numEdges) {
        this.emptyGraph(numVertices);
        const vertices = Array.from({ length: numVertices }, (_, index) => index);
        shuffle(vertices);
        let currentNumEdges;
        if (numVertices > 1) {
            for (let i = 0; i < numVertices - 1; i++)
                this.addEdge(vertices[i], vertices[i+1]);
            currentNumEdges = numVertices - 1;
            let from = numVertices - 1, to;
            while (true) {
                if (currentNumEdges >= numEdges - 1) 
                    to = 0;
                else
                    to = random(0, from-1);
                this.addEdge(vertices[from], vertices[to]);
                currentNumEdges++;
                if (to == 0) break;
                from = to;
            }
        }
        while (currentNumEdges < numEdges) {
            const source = random(numVertices - 1);
            const target = random(numVertices - 1);
            if (source == target) continue;
            if (this.hasEdge(vertices[source], vertices[target]) ||
                this.hasEdge(vertices[target], vertices[source]))
                continue;
            this.addEdge(vertices[source], vertices[target]);
            currentNumEdges++;
        }
    }
    
    
    // graph for ilustrating Tarjan's SCC algorithm
    // it has numComponents strongly connected components (SCC) where each SCC
    // contains between 1 and maxComponent vertices
    randomTarjanSCC(numComponents, maxComponent=4, maxIntercomponentEdges=3) {
        // condensed DAG of a graph (graph connecting its sccs)
        const dag = Graph.directed();
        dag.randomConnectedDAG(numComponents, Math.min(2*numComponents, numComponents*(numComponents-1)/2));
        // number of vertices in each component
        const card = new Array(numComponents);
        for (let i = 0; i < numComponents; i++)
            card[i] = 1 + random(maxComponent - 1);
        // prefix sums of card array - usefull for calculating vertex indices
        let prefixSums = new Array(numComponents+1);
        prefixSums[0] = 0;
        for (let i = 1; i <= numComponents; i++)
            prefixSums[i] = prefixSums[i-1] + card[i-1];

        // number of vertices of the final graph
        const numVertices = prefixSums[prefixSums.length - 1];
        this.emptyGraph(numVertices);

        // permutation of vertices
        const vertices = Array.from({ length: numVertices - 1}, (_, index) => index + 1);
        shuffle(vertices);
        vertices.unshift(0);

        // generate each scc
        for (let c = 0; c < numComponents; c++) {
            const component = Graph.directed();
            // number of vertices and edges in the scc
            const n = card[c];
            const m = random(n, Math.min(Math.floor(1.5*n), n*(n - 1)/2));
            // generate scc and add it to the graph
            component.randomStronglyConnected(n, m);
            for (const edge of component.getEdges()) {
                const [from, to] = edge;
                this.addEdge(vertices[prefixSums[c] + from], vertices[prefixSums[c] + to]);
            }
        }
        // connect sccs
        for (const edge of dag.getEdges()) {
            const [from, to] = edge;
            // multiply each inter scc edge num times
            let num = random(1, maxIntercomponentEdges);
            for (let i = 0; i < num; i++) {
                const from1 = vertices[prefixSums[from] + random(card[from] - 1)];
                const to1 = vertices[prefixSums[to] + random(card[to] - 1)];
                if (!this.hasEdge(from1, to1))
                    this.addEdge(from1, to1);
            }
        }
    }


    // ALGORITHMS

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

    dfs(vertex=0, visited=undefined) {
        if (visited === undefined)
            visited = new Array(this.numVertices()).fill(false);
        const trace = []
        this.dfsRec(vertex, visited, trace);
        return trace;
    }

    dfsTree(vertex=0, visited=undefined) {
        return this.dfs(vertex, visited).filter(item => item.length == 2);
    }
    

    dfsParent(vertex=0, visited=undefined) {
        const parent = new Array(this.numVertices()).fill(-1);
        this.dfsTree(vertex, visited).forEach(edge => {
            const [from, to] = edge;
            parent[to] = from;
        });
        return parent;
    }

    dfsOrder(vertex=0, visited=undefined) {
        const treeEdges = this.dfsTree(vertex, visited);
        if (treeEdges.length == 0)
            return [vertex];
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

    dfsPreorderNumeration(vertex=0, visited=undefined) {
        const dfsTrace = this.dfs(vertex, visited);
        const preorder = new Array(this.numVertices()).fill(-1);
        if (dfsTrace.length == 0) {
            preorder[vertex] = 0;
            return preorder;
        }
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

    dfsPostorderNumeration(vertex=0, visited=undefined) {
        const dfsTrace = this.dfs(vertex, visited);
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
        if (this.directed)
            return this.dfsLowlinkDirected(vertex);
        else
            return this.dfsLowlinkUndirected(vertex);
    }
    
    dfsLowlinkUndirected(vertex = 0) {
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

    dfsLowlinkDirected(start = 0) {
        return this.tarjan_scc()[1];
    }

    dfsEdgeClassification(start=0) {
        const preOrder = this.dfsPreorderNumeration(start);
        const postOrder = this.dfsPostorderNumeration(start);
        const parent = this.dfsParent(start);
        const edgeType = {};
        this.getEdges().forEach(edge => {
            const [v, w] = edge;
            const edgeStr = JSON.stringify(edge);
            if (preOrder[v] == -1 || postOrder[v] == -1 ||
                preOrder[w] == -1 || postOrder[w] == -1)
                return;

            if (this.directed) {
                if (parent[w] == v)
                    edgeType[edgeStr] = 'treeEdge';
                else if (postOrder[v] <= postOrder[w])
                    edgeType[edgeStr] = 'backEdge';
                else if (preOrder[v] > preOrder[w])
                    edgeType[edgeStr] = 'crossEdge';
                else
                    edgeType[edgeStr] = 'directEdge';
            } else {
                if (parent[w] == v || parent[v] == w)
                    edgeType[edgeStr] = 'treeEdge';
                else
                    edgeType[edgeStr] = 'backEdge';
            }
        });
        return edgeType;
    }

    connected() {
        return this.connectedComponents(0).every(c => c == 0);
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

    tarjan_scc() {
        const component = new Array(this.numVertices()).fill(-1);
        let componentNum = 0;
        const stack = [];
        const preOrder = new Array(this.numVertices()).fill(-1);
        let preOrderNum = 0;
        const lowlink = new Array(this.numVertices()).fill(-1);
        const inStack = new Array(this.numVertices()).fill(false);
        const self = this;
        const order = [];
        function dfs(v) {
            order.push(v);
            preOrder[v] = lowlink[v] = preOrderNum++;
            stack.push(v); inStack[v] = true;
            self.neighbours[v].forEach(n => {
                if (preOrder[n] == -1) {
                    dfs(n);
                    lowlink[v] = Math.min(lowlink[v], lowlink[n]);
                } else if (inStack[n])
                    lowlink[v] = Math.min(lowlink[v], preOrder[n]);
            });
            if (lowlink[v] == preOrder[v]) {
                let vv;
                do {
                    vv = stack.pop();
                    inStack[vv] = false;
                    component[vv] = componentNum;
                } while (vv != v);
                componentNum++;
            }
        }
        for (let v = 0; v < this.numVertices(); v++)
            if (preOrder[v] == -1)
                dfs(v);
        return [component, lowlink.map(v => order[v])];
    }

    stronglyConnectedComponents() {
        return this.tarjan_scc()[0];
    }

    connectedComponents() {
        const components = new Array(this.numVertices()).fill(-1);
        let component = 0;
        for (let v = 0; v < this.numVertices(); v++) {
            if (components[v] == -1) {
                this.dfsOrder(v).forEach(vertex => components[vertex] = component);
                component++;
            }
        }
        return components;
    }
    

    topologicalSort() {
        const order = [];
        const indeg = this.indegree();
        const queue = [];
        for (let v = 0; v < this.numVertices(); v++)
            if (indeg[v] == 0)
                queue.push(v);
        while (queue.length > 0) {
            const v = queue.shift();
            order.push(v);
            this.neighbours[v].forEach(n => {
                if (--indeg[n] == 0)
                    queue.push(n);
            });
        }
        return order;
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

    // HELPER FUNCTIONS

    // make adjacency lists from a given set of edges
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
    
    // check if two edges are equal
    static equalEdges(g1, g2, directed=true) {
        if (!g1 || !g2)
            return false;
        var [a1, b1] = g1;
        var [a2, b2] = g2;
        if (directed)
            return a1 == a2 && b1 == b2;
        else
            return (a1 == a2 && b1 == b2) || (a1 == b2 && a2 == b1);
    }

    // check if edge is in the given set of edges
    static inEdgeSet(edge, edges, directed) {
        return edges.some(e => Graph.equalEdges(e, edge, directed));
    }

    // check if two sets of edges are equal (order is not important)
    static edgeSetsEqual(set1, set2, directed) {
        return set1.length == set2.length &&
               set1.every(edge => Graph.inEdgeSet(edge, set2, directed));
    }

    // check if two arrays of edges are equal (order is important)
    static edgeArraysEqual(arr1, arr2, directed) {
        if (arr1.length != arr2.length)
            return;
        return arr1.every((edge, i) => Graph.equalEdges(edge, arr2[i], directed))
    }

    // check if array of edges contains duplicates
    static edgeArrayDistinct(edges, directed) {
        return edges.every((edge, i) => !Graph.inEdgeSet(edge, edges.slice(0, i), directed));
    }

    
    // format a vertex label using given numeration style 
    static vertexString(vertex, numerationStyle) {
        if (numerationStyle == "A")
            return String.fromCharCode('A'.charCodeAt(0) + vertex);
        else if (numerationStyle == "a")
            return String.fromCharCode('a'.charCodeAt(0) + vertex);
        else if (numerationStyle == "")
            return "";
        else
            return vertex;
    }
}

export class WeightedGraph extends Graph {
    constructor(directed=true,n=0) {
        super(directed, n)
        this.weighted = true;
        this.directed = directed;
    }

    static directed(n=0) {
        return new WeightedGraph(true, n);
    }

    static undirected(n=0) {
        return new WeightedGraph(false, n);
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
                const w = random(minWeight, maxWeight);
                if (this.hasEdge(i, j))
                    this.setWeight(i, j, w);
            }
    }

    randomDifferentWeights(minWeight, maxWeight) {
        const weights = [];
        for (let w = minWeight; w <= maxWeight; w++)
            weights.push(w);
        shuffle(weights);
        this.getEdges().forEach((edge, i) => {
            this.setWeight(...edge, weights[i]);
        });
    }

    closeEdges(postion, eps) {
        Graph.fullGraphEdges(this.numVertices(), this.directed).forEach(edge => {
            const [from, to] = edge;
            if (distance(postion[from][0], postion[from][1], postion[to][0], postion[to][1]) <= eps)
                this.addEdge(from, to);
        });
    }

    euclideanWeights(position) {
        this.getEdges().forEach(edge => {
            const [from, to] = edge;
            this.setWeight(from, to, distance(position[from][0], position[from][1], position[to][0], position[to][1]));
        });
    }

    randomGraph(numVertices, numEdges, minWeight=1, maxWeight=100) {
        super.randomGraph(numVertices, numEdges);
        this.randomWeights(minWeight, maxWeight);
    }

    fullGraph(numVertices, minWeight=1, maxWeight=100) {
        super.fullGraph(numVertices);
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

    bellmanFord(vertex = 0) {
        const dist = new Array(this.numVertices()).fill(Infinity);
        const parent = new Array(this.numVertices()).fill(null);
        dist[vertex] = 0;
        const commands = [];
        for (let i = 0; i < graph.numVertices() - 1; i++) {
            this.getEdges().forEach(edge => {
                let [u, v] = edge;
                if (dist[u] + graph.getWeight(u, v) < dist[v]) {
                    dist[v] = dist[u] + graph.getWeight(u, v);
                    parent[v] = u;
                }
            });
        }
        const negativeCycle = this.getEdges().some(edge => {
            const [u, v] = edge;
            return dist[u] + graph.getWeight(u, v) < dist[v];
        });
        return {dist: dist, parents: parent, negativeCycle: negativeCycle};
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
	    this.neighbours[i].forEach(j => {
		M[i][j] = this.weights[i][j];
		Mp[i][j] = [i, j];
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

        this._listeners = [];
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
        this._listeners.push([event, handler]);
    }

    removeAllListeners() {
        this._listeners.forEach(pair => {
            const [event, handler] = pair;
            this._canvas.removeEventListener(event, handler);
        });
        this._listeners = [];
    }
}

export class GraphDrawing {
    constructor(graph, canvas, width, height) {
        if (width)
            canvas.width = width;
        if (height)
            canvas.height = height;

        if (canvas != undefined)
            this.canvas = new GraphDrawingCanvas(canvas);

        this.setCSS();
        
        this.setGraph(graph);
        
        this.singleSelectVertex = true;
        this.singleSelectEdge = false;

        this.drawVertices = true;
        this.drawEdges = true;
    }

    setGraph(graph) {
        this.graph = graph;
        
        const n = graph.numVertices();
        
        this.vertexPosition = Array.from({length: n}, () => [0, 0]);
        
        this.vertexLabels = Array.from({length: n}, () => undefined);
        this.vertexContent = Array.from({length: n}, () => undefined);
        this.vertexCSS = Array.from({length: n}, () => undefined);
        
        this.edgeLabels = {}
        this.edgeCSS = {}

        this.drawFocusVertex = false;
        this.focusVertex = undefined;
        this.focusEdge = undefined;
        
        this.selectedVertices = [];
        this.selectedEdges = [];

        this.canvas.removeAllListeners();

        if (graph.weighted)
            this.setWeightLabels();
        
        this.draw();
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

    curveDoubleEdges() {
        if (!this.graph.directed)
            return;
        for (const edge of this.graph.getEdges()) {
            if (this.graph.hasEdge(edge[1], edge[0])) {
                this.setEdgeCSSProperty(edge, "curvature", 0.3);
                this.setEdgeCSSProperty([edge[1], edge[0]], "curvature", 0.3);
            }
        }
    }
    

    // VERTEX ARRANGEMENT
    
    static circularArrangementPosition(n, cx, cy, r) {
        if (n == 1) return [[cx, cy]];
        function position(vertex) {
            const alpha = Math.PI / 2 + vertex * (2*Math.PI / n);
            const x = cx + r * Math.cos(alpha);
            const y = cy - r * Math.sin(alpha);
            return [x, y];
        }
        return [...Array(n).keys()].map(vertex => position(vertex));
    }
    
    circularArrangement(cx, cy, r) {
        this.vertexPosition = GraphDrawing.circularArrangementPosition(this.numVertices(), cx, cy, r);
        this.draw();
    }

    static latticeArrangementPosition(m, n, x0, y0, width, height) {
        function position(vertex, m, n) {
            const j = vertex % n;
            const i = Math.floor(vertex / n);
            const w = width / (n-1), h = height / (m-1);
            const x = x0 + j * w;
            const y = y0 + i * h;
            return [x, y];
        }
        return [...Array(m*n).keys()].map(vertex => position(vertex, m, n));
    }
    
    latticeArrangement(m, n, x0, y0, width, height) {
        this.vertexPosition = GraphDrawing.latticeArrangementPosition(m, n, x0, y0, width, height);
        this.draw();
    }

    randomArrangement(x0, y0, width, height, minDist) {
        function random(a, b) {
            return a + Math.random() * (b - a);
        }
        for (let v = 0; v < this.numVertices(); v++) {
            do {
                this.vertexPosition[v] = [random(x0, x0 + width), random(y0, y0 + height)]
            } while(this.graph.getVertices().slice(0, v).some(vv => distance(this.vertexPosition[vv][0], this.vertexPosition[vv][1], this.vertexPosition[v][0], this.vertexPosition[v][1]) < minDist));
        }
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
    
    lineArrangementPosition(order, x0, y0, w) {
        const position = new Array(this.graph.numVertices()).fill([0, 0]);
        let index = new Array(order.length);
        for (let i = 0; i < order.length; i++)
            index[order[i]] = i;

        position[order[0]] = [x0, y0];
        if (order.length == 1)
            return;
        const dw = w / (order.length - 1);
        for (let i = 1; i < order.length; i++)
            position[order[i]] = [x0 + i*dw, y0];
        return position;
    }

    lineArrangement(order, x0, y0, w) {
        this.vertexPosition = this.lineArrangementPosition(order, x0, y0, w);
    }

    twoLevelCircularArrangement(x0, y0, w, h, component) {
        const numComponents = Math.max(...component) + 1;
        const componentCard = new Array(numComponents).fill(0);
        component.forEach(c => {componentCard[c]++;});
        const D = Math.min(w/2, h/2);
        const R = 2*D/3;
        const r = R*Math.sin(Math.PI / numComponents) * (2/3);
        const componentCenter = GraphDrawing.circularArrangementPosition(numComponents, x0 + w/2, y0 + h/2, R)
        const positions = [];
        componentCard.forEach((card, c) => {
            let [cx, cy] = componentCenter[c];
            positions.push(GraphDrawing.circularArrangementPosition(card, cx, cy, r));
        });
        component.forEach((c, v) => {
            this.vertexPosition[v] = positions[c][--componentCard[c]];
        });
        this.draw();
    }
    

    shake(n) {
        this.vertexPosition = this.vertexPosition.map(p => [p[0] + Math.random() * n - n/2, p[1] + Math.random() * n - n/2])
    }

    animateArrangement(newVertexPosition, numSteps=30, animationTime=500, animationDelay, callback) {
        if (animationDelay == undefined)
            animationDelay = animationTime / 2;
        
        this.draw();
        let t = 0;
        let step = 0;
        const startVertexPosition = [...this.vertexPosition];
        const self = this;
        function showStep() {
            for (let vertex = 0; vertex < self.numVertices(); vertex++) {
                const [x0, y0] = startVertexPosition[vertex];
                const [x1, y1] = newVertexPosition[vertex];
                self.vertexPosition[vertex] = [(1-t)*x0 + t*x1, (1-t)*y0 + t*y1];
            }
            self.draw();
            t += 1 / (numSteps-1);
            step++;
            if (step < numSteps)
                setTimeout(showStep, animationTime/(numSteps - 1));
            else {
                if (callback != undefined)
                    callback();
            }
        }
        setTimeout(showStep, animationDelay);
    }

    // VERTEX CONTENT
    getVertexContent(vertex, numerationStyle) {
        if (this.vertexContent[vertex] !== undefined) {
            const str = this.vertexContent[vertex];
            if (/^-?\d+$/.test(str))
                return parseInt(str);
            else
                return str;
        } else
            return Graph.vertexString(vertex, numerationStyle);
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

    removeAllEdgeLabels() {
        this.graph.getEdges().forEach(edge => this.removeEdgeLabel(edge));
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

    hideEdge(edge) {
        this.setEdgeCSSProperty(edge, "show", false);
    }

    showEdge(edge) {
        this.setEdgeCSSProperty(edge, "show", true);
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
    closeToEdge(edge, x, y, curvature=0) {
        if (curvature == 0) {
            var [vertex1, vertex2] = edge;
            var [x0, y0] = this.vertexPosition[vertex1];
            var [x1, y1] = this.vertexPosition[vertex2];
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
        edge = this.graph.normalizeEdge(edge);
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
        
        function drawEdgeLine(ctx, x1, y1, x2, y2, width, color, lineStyle, directed, label, labelBackgroundColor, labelPosition, curvature, vertexSize1, vertexSize2) {
            var d = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
            if (lineStyle == "dashed")
                lineStyle = [5, 5];
            else if (lineStyle == "dotted")
                lineStyle = [2, 2];
            else
                lineStyle = [];
            
            ctx.save();
            ctx.translate(x2, y2);
            var alpha = Math.atan2(y2 - y1, x2 - x1);
            ctx.rotate(alpha);

            var bottomX = -d, bottomY = 0;
            var topX = 0, topY = 0;

            // draw "line"
            ctx.beginPath();
            ctx.lineWidth = width;
            ctx.setLineDash(lineStyle);
            ctx.strokeStyle = color;
            ctx.moveTo(bottomX, bottomY);
            const midX = (bottomX + topX) / 2;
            const midY = -curvature * midX;
            ctx.quadraticCurveTo(midX, midY, topX, topY);
            ctx.stroke();

            const Cx = t => bottomX*(1-t)**2 + 2*midX*t*(1-t) + topX*t**2;
            const Cy = t => bottomY*(1-t)**2 + 2*midY*t*(1-t) + topY*t**2;
            
            // draw "arrow"
            if (directed) {
                if (curvature != 0) {
                    ctx.save();
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
                const length = Math.min(15, 2 * (d - vertexSize1 - vertexSize2) / 3);
                
                ctx.moveTo(topX - vertexSize2 - length, topY - length / 4);
                ctx.lineTo(topX - vertexSize2, topY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(topX - length - vertexSize2, topY + length / 4);
                ctx.lineTo(topX - vertexSize2, topY);
                ctx.stroke();
                
                if (curvature != 0)
                    ctx.restore();
            }

            // print label
            if (label !== undefined) {
                label = render(label);
                const labelSize = "15px";
                ctx.font = labelSize + " " + "Arial";
                let labelPositionX, labelPositionY;
                if (curvature == 0) {
                    labelPositionX = bottomX + (topX - bottomX)*labelPosition;
                    labelPositionY = bottomY + (topY - bottomY)*labelPosition;
                } else {
                    labelPositionX = Cx(labelPosition);
                    labelPositionY = Cy(labelPosition);
                }

                ctx.translate(labelPositionX, labelPositionY);
                ctx.rotate(-alpha);
                ctx.beginPath();
                ctx.arc(0, 0, width+1, 0, 2*Math.PI);
                ctx.fill();

                const dx = 5 + width, dy = - width;
                if (labelBackgroundColor !== undefined) {
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = labelBackgroundColor;
                    const paddingX = 2, paddingY = 2;
                    const textWidth = ctx.measureText(label).width + 2*paddingX;
                    const textHeight = parseInt(labelSize) + 2*paddingY;
                    ctx.fillRect(dx - paddingX, dy - textHeight + paddingY, textWidth, textHeight);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(dx - paddingX, dy - textHeight + paddingY, textWidth, textHeight);
                }

                ctx.fillStyle = "black";
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";
                ctx.fillText(label, dx, dy);
            }
            ctx.restore();
        }

        function drawEdgeLoop(ctx, x, y, width, color, label) {
            ctx.beginPath();
            ctx.ellipse(x, y - 10, 10, 15, Math.PI, 0, 2*Math.PI);
            ctx.stroke();
        }

        function drawVertexCircle(ctx, x, y, size, width, borderColor, color, fontFamily, fontSize, content, label, labelSize, labelColor, labelBackgroundColor) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.font = fontSize + " " + fontFamily;
            ctx.fillStyle = hsvColor(color).v >= 0.6 ? "black" : "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            content = render(content);
            ctx.fillText(content, x, y);
            if (label !== undefined) {
                label = render(label);
                ctx.font = labelSize + " " + fontFamily;
                ctx.fillStyle = labelColor;

                const x0 = x + size + 5, y0 = y - size;

                if (labelBackgroundColor != null) {
                    const padding = 2;
                    const textWidth = ctx.measureText(label).width + padding + 2;
                    const textHeight = parseInt(labelSize) + padding;
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = labelBackgroundColor;
                    ctx.fillRect(x0 - padding, y0 - textHeight / 2, textWidth, textHeight);
                    ctx.globalAlpha = 1;
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = labelColor;
                    ctx.strokeRect(x0 - padding, y0 - textHeight / 2, textWidth, textHeight);
                }
                
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillStyle = labelColor;
                ctx.fillText(label, x0, y0);
            }
	    ctx.restore();
        }

        const self = this;
        function drawEdge(ctx, edge, css, vertexCSS1, vertexCSS2) {
            const [vertex1, vertex2] = edge;
            if (css == undefined)
                css = self.CSS.edge;

            if ("show" in css && !css.show)
                return;
            
            if (vertexCSS1 == undefined)
                vertexCSS1 = self.CSS.vertex;
            if (vertexCSS2 == undefined)
                vertexCSS2 = self.CSS.vertex;

	    const width = "width" in css ? css.width : self.CSS.edge.width;
	    const lineStyle = "lineStyle" in css ? css.lineStyle : self.CSS.edge.lineStyle;
	    const color = "color" in css ? css.color : self.CSS.edge.color;
	    const curvature = "curvature" in css ? css.curvature : self.CSS.edge.curvature;
            const label = self.getEdgeLabel(edge);
	    const labelPosition = "labelPosition" in css ? css.labelPosition : self.CSS.edge.labelPosition;
	    const labelBackgroundColor = "labelBackgroundColor" in css ? css.labelBackgroundColor : self.CSS.edge.labelBackgroundColor;
            
            if (vertex1 != vertex2) {
                const [x1, y1] = self.vertexPosition[vertex1];
                const [x2, y2] = self.vertexPosition[vertex2];
                const vertexSize1 = "size" in vertexCSS1 ? vertexCSS1["size"] : self.CSS.vertex.size;
                const vertexSize2 = "size" in vertexCSS2 ? vertexCSS2["size"] : self.CSS.vertex.size;
                drawEdgeLine(ctx, x1, y1, x2, y2, width, color, lineStyle, self.graph.directed, label, labelBackgroundColor, labelPosition, curvature, vertexSize1, vertexSize2);
            } else {
                const [x, y] = self.vertexPosition[vertex1];
                const vertexSize =  "size" in vertexCSS1 ? vertexCSS1["size"] : self.CSS.vertex.size;
                drawEdgeLoop(ctx, x, y, width, color, label, vertexSize);
            }
        }

        function drawVertex(ctx, vertex, css) {
            if (css == undefined)
                css = self.CSS.vertex;
            if ("show" in css && !css.show)
                return;
            const [x, y] = self.vertexPosition[vertex];
	    const color = "color" in css ? css.color : self.CSS.vertex.color;
	    const size = "size" in css ? css.size : self.CSS.vertex.size;
	    const width = "width" in css ? css.width : self.CSS.vertex.width;
	    const borderColor = "borderColor" in css ? css.borderColor : self.CSS.vertex.borderColor;
            const fontFamily = "fontFamily" in css ? css.fontFamily : self.CSS.vertex.fontFamily;
            const fontSize = "fontSize" in css ? css.fontSize : self.CSS.vertex.fontSize;
            const label = self.vertexLabels[vertex];
            const numerationStyle = "numerationStyle" in css ? css.numerationStyle : self.CSS.vertex.numerationStyle;
            const content = self.getVertexContent(vertex, numerationStyle);
            const labelSize = "labelSize" in css ? css.labelSize : self.CSS.vertex.labelSize;
            const labelColor = "labelColor" in css ? css.labelColor : self.CSS.vertex.labelColor;
            const labelBackgroundColor = "labelBackgroundColor" in css ? css.labelBackgroundColor : self.CSS.vertex.labelBackgroundColor;
            
            drawVertexCircle(ctx, x, y, size, width, borderColor, color, fontFamily, fontSize, content, label, labelSize, labelColor, labelBackgroundColor);
        }

        const ctx = this.canvas.ctx();
        ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

        // draw edges that are not in focus and not selected
        if (this.drawEdges) {
            this.graph.getEdges().forEach(edge => {
            if (!Graph.equalEdges(this.focusEdge, edge) && !this.isSelectedEdge(edge)) {
                    const edgeCSS = this.getEdgeCSS(edge);
                    const [v1, v2] = edge;
                    const vertexCSS1 = this.getVertexCSS(v1);
                    const vertexCSS2 = this.getVertexCSS(v2);
                    drawEdge(ctx, edge, edgeCSS, vertexCSS1, vertexCSS2);
                }
            });

            // draw selected edges
            this.selectedEdges.forEach(edge => {
                const css = {...this.getEdgeCSS(edge)};
                for (const property in this.CSS.selectedEdge)
                    css[property] = this.CSS.selectedEdge[property];
                const [v1, v2] = edge;
                const vertexCSS1 = this.getVertexCSS(v1);
                const vertexCSS2 = this.getVertexCSS(v2);
                drawEdge(ctx, edge, css, vertexCSS1, vertexCSS2);
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
        }

        if (this.drawVertices) {
            // draw vertices that are not in focus
            for (let vertex = 0; vertex < this.numVertices(); vertex++)
                if (vertex != this.focusVertex || !this.drawFocusVertex) {
                    const css = this.vertexCSS[vertex] ? this.vertexCSS[vertex] : this.CSS.vertex;
                    drawVertex(ctx, vertex, css);
                }
        
            // draw focus vertex
            if (this.drawFocusVertex && this.focusVertex != undefined) {
                const css = {...this.getVertexCSS(this.focusVertex)};
                for (const property in this.CSS.focusVertex)
                    css[property] = this.CSS.focusVertex[property];
                drawVertex(ctx, this.focusVertex, css);
            }
        
            // draw selected vertices
            this.selectedVertices.forEach(vertex => {
                const css = {...this.getVertexCSS(vertex)};
                for (const property in this.CSS.selectedVertex)
                    css[property] = this.CSS.selectedVertex[property];
                drawVertex(ctx, vertex, css)
            });
        }
    }

    onVertexEvent(event, handler) {
        const self = this;
        this.canvas.addEventListener(event, function(e) {
            const vertex = self.vertexOn(e.offsetX, e.offsetY);
            if (vertex != undefined)
                handler(vertex, e);
        });
    }

    singleClick(handler) {
        return function() {
            this.isSingleClick = true;
            setTimeout(() => {
                if (this.isSingleClick)
                    handler(...arguments);
            }, 250);
        }
    }

    doubleClick(handler) {
        return function() {
            this.isSingleClick = false;
            handler(...arguments);
        }
    }
                            
    onVertexClick(handler) {
        this.onVertexEvent("click", this.singleClick(handler).bind(this));
    }

    onVertexDblClick(handler) {
        this.onVertexEvent("dblclick", this.doubleClick(handler).bind(this));
    }

    onVertexMouseover(handler) {
        this.onVertexEvent("mousemove", handler);
    }

    onVertexEnter(handler) {
        const self = this;
        this.canvas.addEventListener("mousemove", function(e) {
            const vertex = self.vertexOn(e.offsetX, e.offsetY);
            if (self.vertexEnter == undefined && vertex != undefined)
                handler(vertex, e);
            self.vertexEnter = vertex;
        });
    }

    onVertexLeave(handler) {
        const self = this;
        this.canvas.addEventListener("mousemove", function(e) {
            const vertex = self.vertexOn(e.offsetX, e.offsetY);
            if (self.vertexLeave != undefined && self.vertexLeave != vertex)
                handler(self.vertexLeave, e);
            self.vertexLeave = vertex;
        });
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
        this.drawFocusVertex = true;
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

        this.canvas.addEventListener("mousemove", function(e) {
            self.focusVertexOn(e.offsetX, e.offsetY);
        });
    }

    orderVertices(start, vertex) {
        if (this.getVertexLabel(vertex) == undefined)
            this.setVertexLabel(vertex, this.numLabeledVertices() + start);
        else if (this.getVertexLabel(vertex) == this.numLabeledVertices() + start - 1) {
            this.removeVertexLabel(vertex);
        }
    }

    orderVerticesDblClick(start=0) {
        this.onVertexDblClick(vertex => { this.orderVertices(start, vertex); });
    }

    orderVerticesClick(start=0) {
        this.onVertexClick(vertex => { this.orderVertices(start, vertex); });
    }

    orderEdges(edge, start, showLabel, onAdd, onRemove, unique) {
        if (!unique || !Graph.inEdgeSet(edge, this.edgeOrder, this.graph.directed)) {
            this.edgeOrder.push(edge);
            if (showLabel)
                this.setEdgeLabel(edge, start + this.edgeOrder.length - 1);
            onAdd(edge);
        } else if (Graph.equalEdges(this.edgeOrder[this.edgeOrder.length - 1], edge)) {
            this.edgeOrder.pop();
            if (showLabel)
                this.setEdgeLabel(edge, undefined);
            onRemove(edge);
        }
    }

    orderEdgesClick({start=0, showLabel=true, onAdd = (edge => {}), onRemove = (edge => {}), unique=true} = {}) {
        this.edgeOrder = [];
        this.onEdgeClick(edge => { this.orderEdges(edge, start, showLabel, onAdd, onRemove, unique); });
    }

    orderEdgesDblClick({start=0, showLabel=true, onAdd = (edge => {}), onRemove = (edge => {}), unique=true} = {}) {
        this.edgeOrder = [];
        this.onEdgeDblClick(edge => { this.orderEdges(edge, start, showLabel, onAdd, onRemove, unique); });
    }
    
    vertexInput(vertex, callback) {
        const input = document.createElement("input");
        input.type = "text";
        input.style.position = 'fixed';
        const [x, y] = this.vertexPosition[vertex];
        const canvasRect = this.canvas.getBoundingClientRect();
        input.style.textAlign = "center";
        input.style.width = 30 + "px";
        input.style.height = 20 + "px";
        input.style.left = canvasRect.left + x - 18 + 'px';
        input.style.top = canvasRect.top + y - 12 + 'px';
        document.body.appendChild(input);
        input.focus();
        input.onblur = function() {
            callback(vertex, input.value);
            document.body.removeChild(input);
        }
    }

    vertexInputContent(vertex) {
        this.vertexInput(vertex, ((vertex, value) => { if (value) this.setVertexContent(vertex, value); }).bind(this));
    }

    vertexInputLabel(vertex) {
        this.vertexInput(vertex, ((vertex, value) => { if (value) this.setVertexLabel(vertex, value); }).bind(this));
    }

    editValueOnClick() {
        this.onVertexClick(this.vertexInputContent.bind(this));
    }

    editValueOnDblClick() {
        this.onVertexDblClick(this.vertexInputContent.bind(this));
    }

    editLabelOnClick() {
        this.onVertexClick(this.vertexInputLabel.bind(this));
    }

    editLabelOnDblClick() {
        this.onVertexDblClick(this.vertexInputLabel.bind(this));
    }
    
    setCSS() {
        this.CSS = {
            edge: {
                width: 1,
                color: "black",
                curvature: 0,
                labelPosition: 0.5,
                lineStyle: "solid",
                show: true
            },
            
            vertex: {
                color: "white",
                size: 15,
                width: 1,
                borderColor: "black",
                fontFamily: "Arial",
                fontSize: "15px",
                labelSize: "13px",
                labelColor: "black",
                labelBackgroundColor: null,
                numerationStyle: "1",
                show: true
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
