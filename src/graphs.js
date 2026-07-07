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

// Graph /////////////////////////////////////////////////////////////////////////////////

function Graph(list, type) {
    this.contents = list;
    this.type = type;
    this.id =  Math.floor(Math.random() * 1000000000);
}

Graph.prototype.toString = function () {
    var returnString = '';    
    // TODO
    return returnString;
}

Graph.prototype.getEdges = function () {
    var edges;
    // TODO
    switch (this.type) {
        case 'directed flow':
            edges = __parseDirectedFlow(this.contents);
            break;
        case 'directed fork':
            edges = __parseDirectedFork(this.contents);
            break;
        case 'undirected flow':
            // TODO
        case 'undirected fork':
            // TODO
        default:
            throw new Error('unsuported graph type');
    }
    return edges;
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
    var myself = this;

    this.graph = graph || new Graph();
    this.start = 1;
    this.range = 100;
    this.lastCell = null;
    this.parentCell = parentCell || null;

    this.frame = new ScrollFrameMorph(null, 10);
    this.frame.alpha = 0;
    this.frame.acceptsDrops = false;
    this.frame.contents.acceptsDrops = false;

    GraphWatcherMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.rounding,
        1,
        new Color(120, 120, 120)
    );

    this.color = new Color(220, 220, 220);
    this.isDraggable = false;
    this.setExtent(new Point(80, 70));
    this.add(this.frame);
    this.update();
    this.fixLayout();
};

GraphWatcherMorph.prototype.update = function () {
    var i, cell, cnts, max, ceil, vertices, morphs;

    this.frame.contents.children.forEach(m => {
        if (m instanceof CellMorph) {
            if (m.contentsMorph instanceof ListWatcherMorph) {
                m.contentsMorph.update();
            } else if (isSnapObject(m.contents) ||
                    (m.contents instanceof Costume)) {
                m.update();
            }
        } 
    });

    vertices = this.graph.getVertices();

    // adjust start index to current graph size
    this.start = Math.max(
        Math.min(
            this.start,
            Math.floor((vertices.length() - 1) / this.range)
                * this.range + 1
        ),
        1
    );
    
    // refresh existing cells
    // highest index
    max = Math.min(
        this.start + this.range - 1,
        vertices.length()
    );

    // number of morphs available for refreshing
    ceil = Math.min(
        (max - this.start + 1),
        this.frame.contents.children.length
    );

    for (i = 0; i < this.frame.contents.children.length; ++i) {
        cell = this.frame.contents.children[i];
        cnts = vertices.at(i + 1);

        if (cell.contents !== cnts) {
            cell.contents = cnts;
            cell.fixLayout();
            if (this.lastCell) {
                cell.setLeft(this.lastCell.left());
            }
        }
        this.lastCell = cell;
    }

    // remove excess cells
    // number of morphs to be shown
    morphs = max - this.start + 1;

    while (this.frame.contents.children.length > morphs) {
        this.frame.contents.children[morphs].destroy();
    }

    // add additional cells
    ceil = morphs;
    i = this.frame.contents.children.length;

    if (ceil > i + 1) {
        for (i; i < ceil; ++i) {
            cell = new CellMorph(
                vertices.at(i),
                this.cellColor,
                i,
                this.parentCell
            );
            this.frame.contents.add(cell);
        }
    }

    this.fixLayout();
    this.frame.contents.adjustBounds();
    this.frame.contents.setLeft(this.frame.left(0));
};

GraphWatcherMorph.prototype.fixLayout = function () {
    if (this.frame) {
        this.arrangeCells();
        this.frame.setPosition(this.position().add(3));
        this.frame.bounds.corner = this.bounds.corner.subtract(new Point(
            3,
            17
        ));
        this.frame.fixLayout();
        this.frame.contents.adjustBounds();
    }
};

GraphWatcherMorph.prototype.arrangeCells = function () {
    var i, cell, lastCell,
    end = this.frame.contents.children.length;
    for (i = 0; i < end; ++i) {
        cell = this.frame.contents.children[i];
        if (lastCell) {
            cell.setLeft(lastCell.right());;
        }
        lastCell = cell;
    }
    this.frame.contents.adjustBounds();
};

GraphWatcherMorph.prototype.expand = function (maxExtent) {
    // make sure to show all (first 100) cells
    var fe = this.frame.contents.extent(),
        ext = new Point(fe.x + 6, fe.y + 6);
    if (maxExtent) {
        ext = ext.min(maxExtent);
    }
    this.setExtent(ext);
};

GraphWatcherMorph.prototype.show = function () {
    GraphWatcherMorph.uber.show.call(this);
    this.frame.contents.adjustBounds();
};

GraphWatcherMorph.prototype.render = WatcherMorph.prototype.render;