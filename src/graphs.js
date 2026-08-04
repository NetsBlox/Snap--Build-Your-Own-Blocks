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

// Helper function ///////////////////////////////////////////////////////////////////////

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


//////////////////////////////////////////////////////////////////////////////////////////

var Graph;
var GraphWatcherMorph;
var EdgeMorph;
var VertexMorph;

// Graph /////////////////////////////////////////////////////////////////////////////////

function Graph(list, type) {
    this.contents = list;
    this.type = type;
    this.id =  Math.floor(Math.random() * 1000000000);
    this.lastChanged = Date.now();
}

// TODO
Graph.prototype.toString = function () {
    var returnString = '';    
    return returnString;
}

Graph.prototype.getEdges = function () {
    switch (this.type) {
        case 'directed flow':
            return __parseDirectedFlow(this.contents);
        case 'directed fork':
            return __parseDirectedFork(this.contents);
    }
    throw new Error('unsuported graph type');
}

Graph.prototype.getVertices = function () {
    var vertices = new List(),
        graphSize = this.contents.length(),
        temp,
        i, j;

    var _insertIf = function (item) {
        if (vertices.indexOf(item) === 0)
            vertices.add(item)
    };
        
    for (i = 1; i <= graphSize; ++i) {
        if (this.contents.at(i) instanceof Graph) {
            temp = this.contents.at(i).getVertices();
            for (j = 1; j <= temp.length(); ++j)
                _insertIf(temp.at(j));
        }
        else
            _insertIf(this.contents.at(i))
    }
    
    return vertices;
}

Graph.prototype.getRoots = function () {
    var roots = new List(),
        graphSize = this.contents.length(),
        temp, i, j;

    if (this.type === 'directed flow') {
        temp = this.contents.at(1);
        if (temp instanceof Graph)
            return temp.getRoots();
        roots.add(temp);
        return roots;
    }

    if (this.type === 'directed fork') {
        for (i = 1; i <= graphSize; ++i) {
            temp = this.contents.at(i);
            if (!(temp instanceof Graph))
                roots.add(temp);
            else {
                temp = temp.getRoots();
                for (j = 1; j <= temp.length(); ++j)
                    roots.add(temp.at(j))
            }
        }
        return roots;
    }

    throw new Error('unsupported graph type');
}

Graph.prototype.getLeaves = function () {
    var leaves = new List(),
        graphSize = this.contents.length(),
        temp, i, j;

    if (this.type === 'directed flow') {
        temp = this.contents.at(graphSize);
        if (temp instanceof Graph)
            return temp.getLeaves();
        leaves.add(temp);
        return leaves; 
    }
  
    if (this.type === 'directed fork') {
        for (i = 1; i <= graphSize; ++i) {
            temp = this.contents.at(i);
            if (!(temp instanceof Graph))
                leaves.add(temp);
            else {
                temp = temp.getLeaves();
                for (j = 1; j <= temp.length(); ++j)
                    leaves.add(temp.at(j))
            }
        }
        return leaves;
    }

    throw new Error('unsupported graph type');
}

Graph.prototype.valueOf = function () {
    return NaN;
}

// GraphWatcherMorph//////////////////////////////////////////////////////////////////////

GraphWatcherMorph.prototype = new BoxMorph();
GraphWatcherMorph.prototype.constructor = GraphWatcherMorph;
GraphWatcherMorph.uber = BoxMorph.prototype;

GraphWatcherMorph.prototype.cellColor =
    SpriteMorph.prototype.blockColor.graphs;

function GraphWatcherMorph(graph, parentCell) {
    this.init(graph, parentCell);
}

GraphWatcherMorph.prototype.init = function (graph, parentCell) {
    this.graph = graph || new Graph();
    this.parentCell = parentCell || null;

    GraphWatcherMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.rounding,
        1,
        new Color(120, 120, 120)
    );

    // TODO - extent should change automatically with the graph size.
    this.setExtent(new Point(100, 100));

    this.vertex = new VertexMorph('');
    this.add(this.vertex);
};

// TODO
GraphWatcherMorph.prototype.update = function () {
    var vertices = this.graph.getVertices(),
        edges = this.graph.getEdges();

    // syncronize vertex morphs
    // syncronize edge morphs
    // compute layout
    this.fixLayout();
};

// TODO
GraphWatcherMorph.prototype.expand = function (maxExtent) {
    return;
};

// TODO
GraphWatcherMorph.prototype.fixLayout = function () {
    return;
};

GraphWatcherMorph.prototype.render = WatcherMorph.prototype.render;

// EdgeMorph /////////////////////////////////////////////////////////////////////////////

EdgeMorph.prototype = new BoxMorph();
EdgeMorph.prototype.constructor = EdgeMorph;
EdgeMorph.uber = BoxMorph.prototype;

function EdgeMorph(src, dst) {
    this.init(src, dst);
}

EdgeMorph.prototype.init = function (src, dst) {
    this.src = src;
    this.dst = dst;

    EdgeMorph.uber.init.call(
        this,
        0,
        1,
        new Color(120, 120, 120)
    );
};

// VertexMorph ///////////////////////////////////////////////////////////////////////////

VertexMorph.prototype = new CircleBoxMorph();
VertexMorph.prototype.constructor = VertexMorph;
VertexMorph.uber = CircleBoxMorph.prototype;

function VertexMorph(value) {
    this.init(value);
}

VertexMorph.prototype.init = function (value) {
    this.value = value;

    VertexMorph.uber.init.call(this);

    this.setExtent(new Point(10, 10));
};
