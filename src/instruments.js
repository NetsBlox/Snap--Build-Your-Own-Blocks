// Oscillator ////////////////////////////////////////////////////////

function Oscillator(type, parameters) {
    this.init(type, parameters);
}

Oscillator.prototype.options = ['frequency', 'value'];

Oscillator.prototype.init = function (type, parameters) {
    this.type = type;
    this.parameters = this.validateParameters(parameters);
    this.id =  Math.floor(Math.random() * 1000000000);
    console.log(this.parameters);
};

Oscillator.prototype.validateParameters = function (parameters) {
    if (!(parameters instanceof List)) {
        throw Error("parameters must be a list");
    }

    parameters.contents.forEach(element => {
        if (!(element instanceof List)) {
            throw Error("invalid param list");
        }
        if (element.length() !== 2) {
            throw Error("invalid param list");
        }
        const option = element.at(1);
        if (Oscillator.prototype.options.indexOf(option) === -1) {
            throw Error(`invalid param option: ${option}`);
        }
    });
};

Oscillator.prototype.getFrequency = function () {
    if (!this.parameters.frequency) {
        return 440;
    }
    return this.parameters.frequency;
};

Oscillator.prototype.getValue = function () {
    if (!this.parameters.value) {
        return 1;
    }
    return this.parameters.value;
};

Oscillator.prototype.getType = function () {
    return 'oscillator';
}

// Gain //////////////////////////////////////////////////////////////

function Gain(value) {
    this.init(value);
}

Gain.prototype.init = function (value) {
    // TODO - add more validation
    this.parameters = { gain: value };
    this.id =  Math.floor(Math.random() * 1000000000);
};

Gain.prototype.getType = function () {
    return 'gain';
}

// Filter ////////////////////////////////////////////////////////////

function Filter(type, parameters) {
    this.init(type, parameters);
}

Filter.prototype.options = ['frequency', 'Q', 'gain'];

Filter.prototype.init = function (type, parameters) {
    this.type = type;
    this.parameters = this.validateParameters(parameters);
    this.id =  Math.floor(Math.random() * 1000000000);
};

Filter.prototype.validateParameters = function (parameters) {
    if (!(parameters instanceof List)) {
        throw new Error("parameters must be a list");
    }

    parameters.contents.forEach(element => {
        if (!(element instanceof List)) {
            throw Error("invalid param list");
        }
        if (element.length() !== 2) {
            throw Error("invalid param list");
        }
        const option = element.at(1);
        if (Filter.prototype.options.indexOf(option) === -1) {
            throw Error(`invalid param option: ${option}`)
        }
    });
};

Filter.prototype.getType = function () {
    return this.type;
}

// Effect ////////////////////////////////////////////////////////////

function AudioEffect(type, parameters) {
    this.init(type, parameters);
}

AudioEffect.prototype.options = null;

AudioEffect.prototype.init = function (type, parameters) {
    this.type = type;
    switch (type) {
    case 'delay':
        AudioEffect.prototype.options = ['delayTime'];
        break;
    }
    this.parameters = this.validateParameters(parameters);
    this.id =  Math.floor(Math.random() * 1000000000);
};

AudioEffect.prototype.validateParameters = function (parameters) {
    if (!(parameters instanceof List)) {
        throw Error("parameters must be a list");
    }

    parameters.contents.forEach(element => {
        if (!(element instanceof List)) {
            throw Error("invalid param list");
        }
        if (element.length() !== 2) {
            throw Error("invalid param list");
        }
        const option = element.at(1);
        if (AudioEffect.prototype.options.indexOf(option) === -1) {
            throw Error(`invalid param option: ${option}`);
        }
    });
}

AudioEffect.prototype.getType = function () {
    return this.type;
}

// Instrument ////////////////////////////////////////////////////////

function Instrument(graph) {
    this.init(graph);
}

Instrument.prototype.init = function (graph) {
    this.source = this.validateSource(graph);
    this.graph = graph;
};

Instrument.prototype.validateSource = function (graph) {
    if (!(graph instanceof Graph)) {
        throw Error('error: instrument must be created from audio graph');
    }
    if (graph.type !== 'directed flow') {
        throw new Error('instrument must only have one source');
    }
    if (!(graph.contents.at(1) instanceof Oscillator)) {
        throw new Error('invalid audio source');
    }
    // TODO add other valid audio sources
    // TODO add a gain node check
    // TODO there must only be one destination
    // TODO check that only valid blocks are in the graph
    return graph.contents.at(1);
};

Instrument.prototype.getNodeInformation = function () {
    var nodes, info;
    nodes = this.graph.getVertices();
    info = {};

    nodes.contents.forEach(node => {
        if (!info[node.id]) {
            info[node.id] = {
                'type': node.getType(),
                'parameters': node.parameters,
                'id': node.id,
                'connections': []
            };
        }
    });

    return info;
}

Instrument.prototype.getParameters = function () {
    var nodesInfo, edges, 
        src, dst,
        audioNodes;

    nodesInfo = this.getNodeInformation();

    edges = this.graph.getEdges();
    edges.contents.forEach(e => {
        src = e.at(1).id;
        dst = e.at(2).id;
        nodesInfo[src].connections.push(nodesInfo[dst]);
    });

    audioNodes = Object.keys(nodesInfo).map(id => nodesInfo[id]);

    return { 'audioNodes': audioNodes };
}