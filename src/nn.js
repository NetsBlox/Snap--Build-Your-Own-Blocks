/** @import { Morph, BoxMorph } from "./morphic.js" */
/** @import { IDE_Morph } from "./gui.js" */
/** @import { SpriteMorph } from "./objects.js" */
/** @typedef {"weight" | "input" | "output" | "custom"} NodeType*/

class NNEdge {
    constructor(input, output) {
        this.color = new Color(200, 0, 0, 1);
        this.input = input;
        this.output = output;
        this.isDraggable = true;
    }
}

class NNInputMorph extends BoxMorph {
    constructor() {
        super(100, 1, WHITE);
        this.fixLayout();
        this.connections = [];
        this.mouseMove = nop;
    }

    fixLayout() {
        this.setExtent(new Point(10, 10));
    }

    mouseClickLeft() {
        const graph = this.parentThatIsA(NNFrameMorph);
        if (graph.hangingEdge && graph.hangingEdge.output == null) {
            graph?.connectHangingEdge(this);
        } else {
            const newEdge = new NNEdge(null, this);
            graph?.prepareHangingEdge(newEdge);
        }
    }
}

class NNOutputMorph extends BoxMorph {
    constructor() {
        super(100, 1, WHITE);
        this.fixLayout();
        this.connections = [];
        this.mouseMove = nop;
    }

    fixLayout() {
        this.setExtent(new Point(10, 10));
    }

    mouseClickLeft() {
        const graph = this.parentThatIsA(NNFrameMorph);
        if (graph.hangingEdge && graph.hangingEdge.input == null) {
            graph?.connectHangingEdge(this);
        } else {
            const newEdge = new NNEdge(this, null);
            graph?.prepareHangingEdge(newEdge);
        }
    }
}

class NNNodeMorph extends BoxMorph {
    /** @param {NodeType} type */
    constructor(type, name, input = true, output = true) {
        super(100, 0);
        this.setColor(SpriteMorph.prototype.blockColor.operators);

        this.name = new StringMorph(name);
        this.name.isBold = true;
        this.name.fontSize = 18;
        this.name.setColor(WHITE);
        this.name.fixLayout();

        this.add(this.name);

        this.id = null;
        this.isTemplate = true;
        this.nodeType = type;

        if (input) {
            this.input = new NNInputMorph();
            this.add(this.input);
        }

        if (output) {
            this.output = new NNOutputMorph();
            this.add(this.output);
        }

        this.fixLayout();
    }

    fixLayout() {
        this.bounds.setExtent(new Point(100, 100));
        this.name.setCenter(this.center());

        if (this.input) {
            this.input.setCenter(new Point(this.left(), this.center().y));
        }
        if (this.output) {
            this.output.setCenter(new Point(this.right(), this.center().y));
        }
    }
}

class NNInputNodeMorph extends NNNodeMorph {
    constructor() {
        super("input", "Input", false, true);
        this.setColor(SpriteMorph.prototype.blockColor.control);
    }
}

class NNOutputNodeMorph extends NNNodeMorph {
    constructor() {
        super("output", "Output", true, false);
        this.setColor(SpriteMorph.prototype.blockColor.variables);
    }
}

class NNWeightNodeMorph extends NNNodeMorph {
    constructor() {
        super("weight", "Weight", false, true);
        this.setColor(SpriteMorph.prototype.blockColor.operators);
    }
}

class NNFrameMorph extends FrameMorph {
    constructor() {
        super(null);
        this.color = IDE_Morph.prototype.groupColor;
        this.isDraggable = false;

        this.edges = [];
        this.hangingEdge = null;
    }

    render(ctx) {
        FrameMorph.prototype.render.call(this, ctx);

        for (const edge of this.edges) {
            this.renderEdge(ctx, edge);
        }
        if (this.hangingEdge) {
            this.renderEdge(ctx, this.hangingEdge);
        }
    }

    renderEdge(ctx, edge) {
        ctx.beginPath();
        ctx.strokeStyle = IDE_Morph.prototype.buttonLabelColor.toString();
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        if (edge.input) {
            const start = edge.input.center();
            ctx.moveTo(start.x - this.left(), start.y - this.top());
        } else {
            const start = this.world().hand.center();
            ctx.moveTo(start.x - this.left(), start.y - this.top());
        }
        if (edge.output) {
            const end = edge.output.center();
            ctx.lineTo(end.x - this.left(), end.y - this.top());
        } else {
            const end = this.world().hand.center();
            ctx.lineTo(end.x - this.left(), end.y - this.top());
        }
        ctx.stroke();
    }

    wantsDropOf(aMorph) {
        return aMorph instanceof NNNodeMorph;
    }

    reactToDropOf(aMorph) {
        aMorph.id = 1;
    }

    prepareHangingEdge(anEdge) {
        this.hangingEdge = anEdge;
        this.rerender();
    }

    connectHangingEdge(aMorph) {
        const edge = this.hangingEdge;
        this.hangingEdge = null;
        if (edge.input == null) {
            edge.input = aMorph;
        } else if (edge.output == null) {
            edge.output = aMorph;
        }

        this.edges.push(edge);
        this.rerender();
    }

    step() {
        if (this.hangingEdge || this.edges.length) {
            this.rerender();
        }
    }

    mouseClickLeft() {
        if (this.hangingEdge) {
            this.hangingEdge = null;
        }
    }
}

class NNNameMorph extends PushButtonMorph {
    constructor(callback) {
        super(null, callback, "Neural Network 1 ▼");
        this.color = IDE_Morph.prototype.tabColors[0];
        this.highlightColor = IDE_Morph.prototype.tabColors[0];
        this.pressColor = IDE_Morph.prototype.tabColors[0];
        this.labelColor = IDE_Morph.prototype.buttonLabelColor;
        this.labelShadowOffset = new Point(0, 0);
        this.fixLayout();
        this.rerender();
    }

    render(ctx) {
        this.drawOutline(ctx);
        this.drawBackground(ctx, this.pressColor);
        this.drawEdges(
            ctx,
            this.pressColor,
            this.pressColor.darker(this.contrast),
            this.pressColor.lighter(this.contrast),
        );
    }
}

class NNGraphMorph extends ScrollFrameMorph {
    constructor() {
        const contents = new NNFrameMorph();
        super(contents);
        contents.scrollFrame = this;
        this.acceptsDrops = false;

        const callback = () => {
            console.log(this.constructor)
        }

        this.title = new NNNameMorph();
        this.add(this.title);
    }

    fixLayout() {
        this.title.setCenter(this.center());
        this.title.setTop(this.top() + 40);
    }
}

class NNPaletteMorph extends ScrollFrameMorph {
    constructor() {
        super();
        this.nodes = [
            new NNInputNodeMorph(),
            new NNOutputNodeMorph(),
            new NNWeightNodeMorph(),
        ];
        for (const node of this.nodes) {
            this.addContents(node);
        }

        this.acceptsDrops = false;

        this.contents.wantsDropOf = (aMorph) => aMorph instanceof NNNodeMorph;

        this.contents.reactToDropOf = (droppedMorph, hand) => {
            if (!(droppedMorph instanceof NNNodeMorph)) {
                throw new Error(
                    "nnpalette should only accept NNNodeMorph drops",
                );
            }
            if (droppedMorph.id) {
                SnapActions.removeNNNode(droppedMorph);
            } else {
                droppedMorph.perish();
            }
        };
    }

    fixLayout() {
        const gap = 150;
        for (const [i, node] of this.nodes.entries()) {
            node.setExtent(new Point(120, 120));
            node.setCenter(this.center());
            node.setLeft(i * gap + this.left() + gap / 4);
        }
    }
}

class NNManagerMorph extends Morph {
    constructor() {
        super();
        this.graph = new NNGraphMorph();
        this.palette = new NNPaletteMorph();
        this.color = IDE_Morph.prototype.backgroundColor;
        this.add(this.graph);
        this.add(this.palette);
        this.acceptsDrops = false;
    }

    fixLayout() {
        const width = this.width();
        const height = this.height();
        const bottom = this.bottom();
        const top = this.top();

        this.graph.setWidth(width);
        this.graph.setHeight(height * (5 / 6) - 0.5);
        this.graph.setTop(top);
        this.graph.setColor(IDE_Morph.prototype.groupColor);

        this.palette.setWidth(width);
        this.palette.setHeight(height * (1 / 6));
        this.palette.setBottom(bottom);
        this.palette.setColor(SpriteMorph.prototype.paletteColor);
    }
}

class NNTabMorph extends Morph {
    constructor(nn) {
        super();

        this.acceptsDrops = false;
        this.nn = nn;
        this.add(nn);
    }

    fixLayout() {
        this.nn.setWidth(this.width());
        this.nn.setHeight(this.height());
        this.nn.setTop(this.top());
        this.nn.setLeft(this.left());
        this.nn.fixLayout();
    }
}
