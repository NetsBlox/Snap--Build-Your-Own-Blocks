function AudioNode(type, parametersList) {
    this.init(type, parametersList);
}

AudioNode.prototype.init = function (type, parametersList, parameterOptions) {
    parameterOptions = parameterOptions || [];
    this.type = type;
    this.parameters = AudioNode.prototype.parseParameters(parametersList, parameterOptions);
    this.id = Math.floor(Math.random() * 1000000000);
};

AudioNode.prototype.validateParameters = function (parametersList, parameterOptions) {
    parametersList = parametersList || new List();
    
    if (!(parametersList instanceof List)) {
        throw Error("parameters must be a list");
    }

    parametersList.contents.forEach(element => {
        if (!(element instanceof List)) {
            throw Error("invalid param list");
        }
        if (element.length() !== 2) {
            throw Error("invalid param list");
        }
        const option = element.at(1);
        if (parameterOptions.indexOf(option) === -1) {
            throw Error(`invalid param option: ${option}`);
        }
    });

    return parametersList;
};

AudioNode.prototype.parseParameters = function (parametersList, parameterOptions) {
    var _parameters, 
        key, value;
    _parameters = {};
    parametersList = AudioNode.prototype.validateParameters(parametersList, parameterOptions);
    parametersList.contents.forEach(element => {
        key = element.at(1);
        value = element.at(2);
        _parameters[key] = value
    });
    return _parameters;
};

AudioNode.prototype.getType = function () {
    if (this.isOscillator()) {
        return 'oscillator';
    }
    if (this.isBiquad()) {
        return 'biquad';
    }
    return this.type;
};

AudioNode.prototype.getId = function () {
    return this.id;
};

AudioNode.prototype.isOscillator = function () {
    switch (this.type) {
    case 'sine': case 'sawtooth': case 'triangle': case 'square':
        return true;
    default:
        return false;
    }
};

AudioNode.prototype.isBiquad = function () {
    switch (this.type) {
    case 'lowpass': case 'highpass': case 'bandpass': case 'lowshelf':
    case 'highshelf': case 'peaking': case 'notch': case 'allpass':
        return true;
    default:
        return false;
    }
};

// Oscillator ////////////////////////////////////////////////////////

Oscillator.prototype = new AudioNode();
Oscillator.prototype.constructor = Oscillator;
Oscillator.uber = AudioNode.prototype;

function Oscillator(type, parametersList) {
    this.init(type, parametersList);
}

Oscillator.prototype.options = ['frequency', 'value'];

Oscillator.prototype.init = function (type, parametersList) {
    Oscillator.uber.init.call(this, type, parametersList, Oscillator.prototype.options);
    this.parameters['type'] = this.type;
};

// Gain //////////////////////////////////////////////////////////////

Gain.prototype = new AudioNode();
Gain.prototype.constructor = Gain;
Gain.uber = AudioNode.prototype;

function Gain(value) {
    this.init('gain', new List([new List(['gain', value])]));
}

Gain.prototype.options = ['gain'];

Gain.prototype.init = function (type, parametersList) {
    Gain.uber.init.call(this, type, parametersList, Gain.prototype.options);
};

// Filter ////////////////////////////////////////////////////////////

Filter.prototype = new AudioNode();
Filter.prototype.constructor = Filter;
Filter.uber = AudioNode.prototype;

function Filter(type, parametersList) {
    this.init(type, parametersList);
}

Filter.prototype.options = ['frequency', 'Q', 'gain'];

Filter.prototype.init = function (type, parametersList) {
    Filter.uber.init.call(this, type, parametersList, Filter.prototype.options);
    this.parameters['type'] = this.type;
};

// Effect ////////////////////////////////////////////////////////////

AudioEffect.prototype = new AudioNode();
AudioEffect.prototype.constructor = AudioEffect;
AudioEffect.uber = AudioNode.prototype;

function AudioEffect(type, parametersList) {
    this.init(type, parametersList);
}

AudioEffect.prototype.options = null;

AudioEffect.prototype.init = function (type, parametersList) {
    switch (type) {
    case 'delay':
        AudioEffect.prototype.options = ['delayTime'];
        break;
    }
    AudioEffect.uber.init.call(this, type, parametersList, AudioEffect.prototype.options);
};

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
    graph.contents.contents.forEach(node => {
        if (!(node instanceof AudioNode || node instanceof Graph)) {
            throw new Error('audio graph must only be made up of audio nodes');
        }
    });
    // TODO add other valid audio sources
    // TODO add a gain node check
    // TODO there must only be one destination
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
};

Instrument.prototype.getParameters = function () {
    var nodesInfo, edges, 
        src, dst,
        source, audioNodes;

    nodesInfo = this.getNodeInformation();

    edges = this.graph.getEdges();
    edges.contents.forEach(e => {
        src = e.at(1).id;
        dst = e.at(2).id;
        nodesInfo[src].connections.push(nodesInfo[dst]);
    });

    audioNodes = Object.keys(nodesInfo).map(id => nodesInfo[id]);
    source = {
        'type': this.source.getType(),
        'parameters': this.source.parameters,
        'id': this.source.id,
        'connections': []
    };  

    return { 'source': source, 'audioNodes': audioNodes };
};