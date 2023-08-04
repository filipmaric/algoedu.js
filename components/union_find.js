// Union-Find data structure implementation
export class UnionFind {
    constructor(size) {
        this.parent = Array(size).fill().map((_, index) => index);
    }

    find(node) {
        if (this.parent[node] === node)
            return node;
        this.parent[node] = this.find(this.parent[node]);
        return this.parent[node];
    }

    union(nodeA, nodeB) {
        const rootA = this.find(nodeA);
        const rootB = this.find(nodeB);
        if (rootA !== rootB) {
            this.parent[rootA] = rootB;
            return true; // Nodes were merged
        }
        return false; // Nodes were already connected
    }
}
