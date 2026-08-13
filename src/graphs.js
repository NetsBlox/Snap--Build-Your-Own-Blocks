/*

    graphs.js

    graph data structure for SNAP!

    written by Gabriel Barnard
    gabriel.h.barnard@vanderbilt.edu

    TODO:
        * finish edge calculations
        * use a Snap! list for the adjacency matrix
        * find way to toggle between undirected graphs and directed graphs
        * find way to incorporate weight functions
        * graphic for graph data type

*/

function __parseDirectedFlow (graphContents) {
    var edges = new List(),
        seenGraphs = new List(),
        i, j, k,
        src, dst,
        srcGraphEdges, dstGraphEdges;

    for (i = 1; i < graphContents.length(); ++i) {
        src = new List([graphContents.at(i)]) 
        dst = new List([graphContents.at(i+1)]);

        if (src.at(1) instanceof Graph) {
            if (!seenGraphs.contains(src.at(1).id)) {
                srcGraphEdges = src.at(1).getEdges();
                for (j = 1; j <= srcGraphEdges.length(); ++j)
                    edges.add(srcGraphEdges.at(j));
                seenGraphs.add(src.at(1).id);
            }
            src = src.at(1).getLeaves();
        }

        if (dst.at(1) instanceof Graph) {
            if (!seenGraphs.contains(dst.at(1).id)) {
                dstGraphEdges = dst.at(1).getEdges();
                for (j = 1; j <= dstGraphEdges.length(); ++j)
                    edges.add(dstGraphEdges.at(j));
                seenGraphs.add(dst.at(1).id);
            }
            dst = dst.at(1).getRoots();
        }

        for (j = 1; j <= src.length(); ++j)
            for (k = 1; k <= dst.length(); ++k)
                edges.add(new List([src.at(j), dst.at(k)]))
    }

    return edges;
}

function __parseDirectedFork (graphContents) {
    var edges = new List(),
        i, j,
        temp;
    for (i = 1; i <= graphContents.length(); ++i) {
        if (graphContents.at(i) instanceof Graph) {
            temp = graphContents.at(i).getEdges();
            for (j = 1; j <= temp.length(); ++j)
                edges.add(temp.at(j));
        }
    }
    return edges;
}

class Graph {
    #contents;
    #type;
    #id;
    #lastChanged;
    #vertices;
    #edges;

    constructor(list, type) {
        this.#contents = list.contents;
        this.#type = type;
        this.#id = Math.floor(Math.random() * 100000000);
        this.#lastChanged = Date.now();
        this.#loadVertices();
        this.#loadEdges();
    }

    get contents() {
        return this.#contents;
    }

    get verticies() {
        return this.#vertices.map(x => x.snapify());
    }

    // TODO
    get edges() {
        return;
    }

    // TODO
    toString() {
        return '';
    }

    valueOf() {
        return NaN;
    }

    get #roots() {
        return this.#getBoundaryVertices('head');
    }

    get #leaves() {
        return this.#getBoundaryVertices('tail');
    } 

    get #head() {
        return this.#contents[0];
    }

    get #tail() {
        return this.#contents[this.#contents.length];
    }

    #loadVertices() {
        const vertices = new List();
        this.contents.forEach(x => {
            const newElements = x instanceof Graph 
                ? x.getVertices() 
                : new List([x]);

            newElements.contents.forEach(e => {
                if (!vertices.contains(e)) 
                    vertices.add(e);
            });
        });

        this.#vertices = vertices.map(x => new Vertex(x));
    }

    #loadEdges() {
        const edges = new List();
        for (let i = 0; i < this.#contents.length - 1; ++i) {
            
        }
        this.#edges = edges;
    };

    #getBoundaryVertices(endpoint) {
        const elements = (() => {
            switch (this.type) {
                case 'directed flow': return [this[endpoint]];
                case 'directed fork': return this.contents;
                default: throw new Error('unsupported graph type');
            }
        })();

        const vertices = [];
        elements.forEach(v => {
            const arr = v instanceof Graph
                ? v.getBoundaryVertices(endpoint).asArray()
                : [new Vertex(v)];
            vertices.push(...arr);
        });
        return new List(vertices);
    }
}

class GraphWatcherMorph extends BoxMorph {
    #parentCell;
    #graph;

    constructor(graph = new Graph(), parentCell = null) {
        super(
            SyntaxElementMorph.prototype.rounding,
            1,
            new Color(120, 120, 120)
        );

        this.#parentCell = parentCell;
        this.#graph = graph;

        // TODO - extent should change automatically with the graph size/
        this.setExtent(new Point(100, 100));

        this.vertex = new VertexMorph('');
        this.add(this.vertex);
    }

    get parentCell() {
        return this.#parentCell();
    }

    // TODO
    update() {
        const vertices = this.#graph.vertices;
        const edges = this.#graph.edges;

        // syncronize vertex morphs
        // syncronize edge morphs
        // compute layout
        this.fixLayout();
    }

    // TODO
    expand(maxExtent) {
        return;
    }

    // TODO
    fixLayout() {
        return;
    }

    render = WatcherMorph.prototype.render;
}

class Edge {
    #src;
    #dst;

    constructor(src, dst) {
        this.#src = src;
        this.#dst = dst;
    }

    get src() {
        return this.#src;
    }

    get dst() {
        return this.#dst;
    }
}

class EdgeMorph extends BoxMorph {
    #edge;

    constructor(edge) {
        super(0, 1, new Color(120, 120, 120));
        this.#edge = edge;
    }
}

class Vertex {
    #value;

    constructor(value) {
        this.#value = value;
    }

    snapify() {
        return this.#value;
    }

    equals(vertex) {
        return this.snapify() == vertex.snapify(); 
    }
}

class VertexSet {
    #list;

    constructor(list = new List()) {
        list.contents.forEach(element => {
            if (!(element instanceof Vertex))
                throw new Error('VertexSet must only contain Vertex objects');
        });
        this.#list = list;
    }

    // TODO
    contains(vertex) {
        return;
    }
}

class VertexMorph extends CircleBoxMorph {
    #vertex;

    constructor(vertex) {
        super();
        this.#vertex = vertex;
        this.setExtent(new Point(10, 10));
    }
}

