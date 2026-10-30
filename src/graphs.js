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

var Graph;

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

Graph.prototype.changeStamp = function () {
    // answer the most recent modification time of my contents,
    // including those of my sub-graphs
    var stamp = this.contents.lastChanged || 0,
        i, item;
    for (i = 1; i <= this.contents.length(); ++i) {
        item = this.contents.at(i);
        if (item instanceof Graph)
            stamp = Math.max(stamp, item.changeStamp());
    }
    return stamp;
}

// GraphWatcherMorph ////////////////////////////////////////////////////

/*
    I am a little window which observes a graph and shows its vertices
    as cells connected by arrows, continuously updating myself accordingly.
    Vertices are arranged in columns (layers) from left to right, so that
    edges generally point rightward.
*/

var GraphWatcherMorph;
var GraphEdgesMorph;

// GraphWatcherMorph inherits from BoxMorph:

GraphWatcherMorph.prototype = new BoxMorph();
GraphWatcherMorph.prototype.constructor = GraphWatcherMorph;
GraphWatcherMorph.uber = BoxMorph.prototype;

// GraphWatcherMorph default settings

GraphWatcherMorph.prototype.maxVertices = 500;

// GraphWatcherMorph instance creation:

function GraphWatcherMorph(graph, parentCell) {
    this.init(graph, parentCell);
}

GraphWatcherMorph.prototype.init = function (graph, parentCell) {
    this.graph = graph;
    this.parentCell = parentCell || null; // for circularity detection
    this.cellColor = SpriteMorph.prototype.blockColor.graphs;
    this.lastUpdated = null;
    this.cells = [];
    this.edges = []; // [srcIdx, dstIdx] pairs indexing into this.cells
    this.layers = []; // arrays of cell indices, one per column
    this.layerOf = []; // column of each cell
    this.hasSelfLoop = []; // whether each cell needs room for a loop
    this.hasBackEdges = false;
    this.hasSameLayerEdges = false;
    this.arrangedSizes = null;
    this.vertexCount = 0;
    this.error = null;

    // elements declarations
    this.label = new StringMorph(
        '',
        SyntaxElementMorph.prototype.fontSize,
        null,
        false,
        false,
        false,
        MorphicPreferences.isFlat ? ZERO : new Point(1, 1),
        WHITE
    );

    this.frame = new ScrollFrameMorph(null, 10);
    this.frame.alpha = 0;
    this.frame.acceptsDrops = false;
    this.frame.contents.acceptsDrops = false;

    this.edgesMorph = new GraphEdgesMorph(this);
    this.frame.contents.add(this.edgesMorph);

    this.handle = new HandleMorph(
        this,
        80,
        70,
        3,
        3
    );
    this.handle.setExtent(new Point(13, 13));

    GraphWatcherMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.rounding,
        1,
        new Color(120, 120, 120)
    );

    this.color = new Color(220, 220, 220);
    this.isDraggable = false;
    this.setExtent(new Point(80, 70).multiplyBy(
        SyntaxElementMorph.prototype.scale
    ));
    this.add(this.label);
    this.add(this.frame);
    this.add(this.handle);
    this.handle.fixLayout();
    this.update(true);
    this.fixLayout();
};

// GraphWatcherMorph updating:

GraphWatcherMorph.prototype.update = function (anyway) {
    var stamp = this.graph.changeStamp();

    this.cells.forEach(cell => {
        if (cell.contentsMorph instanceof ListWatcherMorph ||
                cell.contentsMorph instanceof GraphWatcherMorph) {
            cell.contentsMorph.update();
        } else if (isSnapObject(cell.contents) ||
                (cell.contents instanceof Costume)) {
            cell.update();
        }
    });

    if (this.lastUpdated !== stamp || anyway) {
        this.rebuild();
        this.lastUpdated = stamp;
    } else if (this.cellSizes() !== this.arrangedSizes) {
        // a vertex cell (e.g. a nested list watcher) has been resized
        this.fixLayout();
    }
};

GraphWatcherMorph.prototype.rebuild = function () {
    var vertices, edges, edge, src, dst, key, cell, i,
        seen = {};

    this.cells.forEach(each => each.destroy());
    this.cells = [];
    this.edges = [];
    this.error = null;

    try {
        vertices = this.graph.getVertices();
        edges = this.graph.getEdges();
    } catch (err) {
        this.error = err.message || err.toString();
        vertices = new List();
        edges = new List();
    }

    this.vertexCount = vertices.length();
    for (i = 1; i <= Math.min(this.vertexCount, this.maxVertices); ++i) {
        cell = new CellMorph(
            vertices.at(i),
            this.cellColor,
            null,
            this.parentCell
        );
        this.cells.push(cell);
        this.frame.contents.add(cell);
    }

    for (i = 1; i <= edges.length(); ++i) {
        edge = edges.at(i);
        src = vertices.indexOf(edge.at(1)) - 1;
        dst = vertices.indexOf(edge.at(2)) - 1;
        if (src < 0 || dst < 0 ||
                src >= this.cells.length || dst >= this.cells.length)
            continue;
        key = src + ',' + dst;
        if (!seen[key]) {
            seen[key] = true;
            this.edges.push([src, dst]);
        }
    }

    this.computeLayers();
    this.frame.contents.setPosition(this.frame.position());
    this.updateLabel();
    this.fixLayout();
};

GraphWatcherMorph.prototype.updateLabel = function () {
    var shown = this.cells.length;
    if (this.error) {
        this.label.text = this.error;
    } else {
        this.label.text = localize('vertices: ') +
            (shown < this.vertexCount ? shown + '/' : '') +
            this.vertexCount + '  ' +
            localize('edges: ') + this.edges.length;
    }
    this.label.fixLayout();
};

// GraphWatcherMorph layout:

GraphWatcherMorph.prototype.computeLayers = function () {
    // assign each vertex a column using the longest path from a root,
    // ignoring edges which would close a cycle, then order the vertices
    // within each column to reduce edge crossings
    var n = this.cells.length,
        edges = this.edges,
        outgoing = [],
        isBack = [],
        state = [],
        postOrder = [],
        layerOf = [],
        preds = [],
        succs = [],
        pos = [],
        bary = [],
        layers = [],
        visit, hasIncoming, sweep, down, order, i, v;

    for (i = 0; i < n; ++i) {
        outgoing.push([]);
        preds.push([]);
        succs.push([]);
        state.push(0);
        layerOf.push(0);
    }
    hasIncoming = new Array(n).fill(false);
    edges.forEach((edge, e) => {
        outgoing[edge[0]].push(e);
        if (edge[0] !== edge[1]) hasIncoming[edge[1]] = true;
    });

    // iterative depth first search to detect back edges
    visit = start => {
        var stack = [[start, 0]],
            top, e, w;
        state[start] = 1;
        while (stack.length) {
            top = stack[stack.length - 1];
            if (top[1] < outgoing[top[0]].length) {
                e = outgoing[top[0]][top[1]++];
                w = edges[e][1];
                if (state[w] === 1) {
                    isBack[e] = true;
                } else if (state[w] === 0) {
                    state[w] = 1;
                    stack.push([w, 0]);
                }
            } else {
                state[top[0]] = 2;
                postOrder.push(top[0]);
                stack.pop();
            }
        }
    };
    for (i = 0; i < n; ++i)
        if (!hasIncoming[i] && state[i] === 0) visit(i);
    for (i = 0; i < n; ++i)
        if (state[i] === 0) visit(i);

    // longest path layering in topological order
    for (i = postOrder.length - 1; i >= 0; --i) {
        v = postOrder[i];
        outgoing[v].forEach(e => {
            if (!isBack[e]) {
                layerOf[edges[e][1]] = Math.max(
                    layerOf[edges[e][1]],
                    layerOf[v] + 1
                );
            }
        });
    }

    this.hasSelfLoop = new Array(n).fill(false);
    this.hasBackEdges = false;
    this.hasSameLayerEdges = false;
    edges.forEach(edge => {
        var src = edge[0], dst = edge[1];
        if (src === dst) {
            this.hasSelfLoop[src] = true;
        } else if (layerOf[dst] > layerOf[src]) {
            preds[dst].push(src);
            succs[src].push(dst);
        } else if (layerOf[dst] < layerOf[src]) {
            this.hasBackEdges = true;
        } else {
            this.hasSameLayerEdges = true;
        }
    });

    for (i = 0; i < n; ++i) {
        while (layers.length <= layerOf[i]) layers.push([]);
        pos[i] = layers[layerOf[i]].length;
        layers[layerOf[i]].push(i);
    }

    // barycenter heuristic, alternately sweeping right and left
    for (sweep = 0; sweep < 4; ++sweep) {
        down = sweep % 2 === 0;
        order = down ? layers : layers.slice().reverse();
        order.forEach(layer => {
            layer.forEach(v => {
                var nbrs = down ? preds[v] : succs[v];
                bary[v] = nbrs.length ?
                    nbrs.reduce((sum, w) => sum + pos[w], 0) / nbrs.length
                        : pos[v];
            });
            layer.sort((a, b) => (bary[a] - bary[b]) || (pos[a] - pos[b]));
            layer.forEach((v, idx) => pos[v] = idx);
        });
    }

    this.layers = layers;
    this.layerOf = layerOf;
};

GraphWatcherMorph.prototype.loopSize = function () {
    return 20 * SyntaxElementMorph.prototype.scale;
};

GraphWatcherMorph.prototype.cellSizes = function () {
    return this.cells.map(cell => cell.width() + 'x' + cell.height()).join();
};

GraphWatcherMorph.prototype.arrangeCells = function () {
    var scale = SyntaxElementMorph.prototype.scale,
        hGap = 30 * scale,
        vGap = 10 * scale,
        loop = this.loopSize(),
        cells = this.cells,
        widths = [],
        heights = [],
        totalHeight = 0,
        origin, x, bounds;

    this.layers.forEach(layer => {
        var w = 0, h = 0;
        layer.forEach(idx => {
            w = Math.max(w, cells[idx].width());
            h += cells[idx].height() + (this.hasSelfLoop[idx] ? loop : 0);
        });
        h += Math.max(layer.length - 1, 0) * vGap;
        widths.push(w);
        heights.push(h);
        totalHeight = Math.max(totalHeight, h);
    });

    origin = this.frame.contents.position().add(this.frame.padding);
    x = origin.x;
    this.layers.forEach((layer, l) => {
        var y = origin.y + (totalHeight - heights[l]) / 2;
        layer.forEach(idx => {
            var cell = cells[idx];
            if (this.hasSelfLoop[idx]) {
                y += loop;
            }
            cell.setPosition(new Point(
                Math.round(x + (widths[l] - cell.width()) / 2),
                Math.round(y)
            ));
            y += cell.height() + vGap;
        });
        x += widths[l] + hGap;
    });

    // the edges layer spans all cells plus room for loops and back edges
    bounds = cells.length ?
        cells.reduce((rect, cell) => rect.merge(cell.bounds), cells[0].bounds)
            : new Rectangle(origin.x, origin.y, origin.x, origin.y);
    bounds = new Rectangle(
        bounds.left(),
        origin.y,
        bounds.right() + (this.hasSameLayerEdges ? loop : 0),
        bounds.bottom() + (this.hasBackEdges ? loop : 0)
    );
    this.edgesMorph.changed();
    this.edgesMorph.bounds = bounds;
    this.edgesMorph.rerender();

    this.arrangedSizes = this.cellSizes();
    this.frame.contents.adjustBounds();
};

GraphWatcherMorph.prototype.fixLayout = function () {
    if (!this.label || !this.frame) {return; }
    this.frame.setPosition(this.position().add(3));
    this.frame.bounds.corner = this.bounds.corner.subtract(new Point(
        3,
        17
    ));
    this.frame.fixLayout();
    this.arrangeCells();

    this.label.setCenter(this.center());
    this.label.setBottom(this.bottom() - 3);

    if (this.parent) {
        this.parent.changed();
        this.parent.fixLayout();
        this.parent.rerender();
    }
};

GraphWatcherMorph.prototype.expand = function (maxExtent) {
    // make sure to show the whole graph if possible
    var fe = this.frame.contents.extent(),
        ext = new Point(fe.x + 6, fe.y + 20); // frame insets
    if (maxExtent) {
        ext = ext.min(maxExtent);
    }
    this.setExtent(ext);
    this.handle.setRight(this.right() - 3);
    this.handle.setBottom(this.bottom() - 3);
};

// GraphWatcherMorph rendering:

GraphWatcherMorph.prototype.render = function (ctx) {
    WatcherMorph.prototype.render.call(this, ctx);
};

// GraphEdgesMorph //////////////////////////////////////////////////////

/*
    I draw the edges of a graph watcher's vertex cells. I sit behind the
    cells inside the watcher's scroll frame and span all of them.
*/

// GraphEdgesMorph inherits from Morph:

GraphEdgesMorph.prototype = new Morph();
GraphEdgesMorph.prototype.constructor = GraphEdgesMorph;
GraphEdgesMorph.uber = Morph.prototype;

// GraphEdgesMorph instance creation:

function GraphEdgesMorph(watcher) {
    this.init(watcher);
}

GraphEdgesMorph.prototype.init = function (watcher) {
    this.watcher = watcher;
    GraphEdgesMorph.uber.init.call(this);
    this.color = new Color(70, 70, 70);
};

// GraphEdgesMorph rendering:

GraphEdgesMorph.prototype.render = function (ctx) {
    var watcher = this.watcher,
        scale = SyntaxElementMorph.prototype.scale,
        loop = watcher.loopSize(),
        offset = this.position().neg(),
        isDirected = !(watcher.graph.type || '').startsWith('undirected'),
        cellsBottom = 0,
        boundsOf = idx => watcher.cells[idx].bounds.translateBy(offset);

    watcher.cells.forEach((cell, idx) =>
        cellsBottom = Math.max(cellsBottom, boundsOf(idx).bottom())
    );

    ctx.strokeStyle = this.color.toString();
    ctx.fillStyle = this.color.toString();
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.lineCap = 'round';

    var arrowHead = (tip, from) => {
        var angle = Math.atan2(tip.y - from.y, tip.x - from.x),
            size = 6 * scale,
            spread = Math.PI / 7;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(
            tip.x - size * Math.cos(angle - spread),
            tip.y - size * Math.sin(angle - spread)
        );
        ctx.lineTo(
            tip.x - size * Math.cos(angle + spread),
            tip.y - size * Math.sin(angle + spread)
        );
        ctx.closePath();
        ctx.fill();
    };

    watcher.edges.forEach(edge => {
        var src = boundsOf(edge[0]),
            dst = boundsOf(edge[1]),
            srcLayer = watcher.layerOf[edge[0]],
            dstLayer = watcher.layerOf[edge[1]],
            start, end, c1, c2, dx, quarter, side;

        if (edge[0] === edge[1]) { // self loop above the cell
            quarter = src.width() / 4;
            start = new Point(src.center().x + quarter, src.top());
            end = new Point(src.center().x - quarter, src.top());
            c1 = new Point(start.x + loop / 2, src.top() - loop);
            c2 = new Point(end.x - loop / 2, src.top() - loop);
        } else if (dstLayer > srcLayer) { // forward, left to right
            start = src.rightCenter();
            end = dst.leftCenter();
            dx = (end.x - start.x) / 2;
            c1 = new Point(start.x + dx, start.y);
            c2 = new Point(end.x - dx, end.y);
        } else if (dstLayer < srcLayer) { // backward, curving underneath
            start = src.bottomCenter();
            end = dst.bottomCenter();
            c1 = new Point(start.x, cellsBottom + loop);
            c2 = new Point(end.x, cellsBottom + loop);
        } else { // within the same column, curving around the right side
            start = src.rightCenter();
            end = dst.rightCenter();
            side = Math.max(src.right(), dst.right()) + loop;
            c1 = new Point(side, start.y);
            c2 = new Point(side, end.y);
        }

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
        ctx.stroke();
        if (isDirected) {
            arrowHead(end, c2);
        }
    });
};

