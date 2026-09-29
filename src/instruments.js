/**
 * @author Gabriel Barnard - gabriel.h.barnard@vanderbilt.edu 
 */

const OSCILLATOR_OPTIONS = ['frequency', 'value'];
const GAIN_OPTIONS = ['gain'];
const FILTER_OPTIONS = ['frequency', 'Q', 'gain'];
const EFFECT_OPTIONS = { delay: ['delayTime'] }; 

class AudioNode {
    /**
     * @param {String} type
     * @param {List} parameters
     * @param {Array} options - valid parameter key values
     */
    constructor(type, parameters, options = []) {
        this._type = type;
        this._parameters = {};
        this._id = Math.floor(Math.random() * 1000000000);
        this._setParameters(parameters, options);
    }

    get type() {
        if (this.isOscillator()) {
            return 'oscillator';
        }
        if (this.isBiquad()) {
            return 'biquad';
        }
        return this._type;
    }

    get parameters() {
        return this._parameters;
    }

    get id() {
        return this._id;
    }

    /**
     * @return {Boolean} true if the Audio Node is a type of oscillator
     */
    isOscillator() {
        switch (this._type) {
            case 'sine': case 'sawtooth': 
            case 'triangle': case 'square':
                return true;
        default:
            return false;
        }
    }

    /**
     * @return {Boolean} true if the Audio Node is a type of filter
     */
    isBiquad() {
        switch (this._type) {
            case 'lowpass': case 'highpass': case 'bandpass': case 'lowshelf':
            case 'highshelf': case 'peaking': case 'notch': case 'allpass':
                return true;
        default:
            return false;
        }
    }
    
    /**
     * @param {List} parameters
     * @param {Array} options - valid parameter key values
     */
    _setParameters(parameters, options) {
        parameters = this._validateParameters(parameters, options);
        parameters.contents.forEach(element => {
            const key = element.at(1);
            const value = element.at(2);
            this._parameters[key] = value;
        });
    }

    /**
     * @param {List} parameters
     * @param {Array} options - valid parameter key values
     * @return a validated parameter list
     * @throws {Error} if the parameters are invalid
     */
    _validateParameters(parameters = new List(), options) {
        if (!(parameters instanceof List)) {
            throw Error("parameters must be of type List"); 
        }

        parameters.contents.forEach(element => {
            if (!(element instanceof List)) {
                throw Error("each parameter entry must be of type List");
            }
            if (element.length() !== 2) {
                throw Error("parameter must contain two elements");
            }

            const option = element.at(1);
            if (options.indexOf(option) === -1) {
                throw Error(`invalid param option: ${option}`);
            }  
        });

        return parameters;
    }
} 

class Oscillator extends AudioNode {
    /**
     * @param {String} type - the type of oscillator
     * @param {List} parameters
     */
    constructor(type, parameters) {
        super(type, parameters, OSCILLATOR_OPTIONS);
        this._parameters['type'] = this._type;
    }
}

class Gain extends AudioNode {
    /**
     * @param {Number} gain
     */
    constructor(value) {
        super(
            'gain', 
            new List([new List(['gain', value])]),
            GAIN_OPTIONS
        );
    }
}

class Filter extends AudioNode {
    /**
     * @param {String} type - the type of filter
     * @param {List} parameters
     */
    constructor(type, parameters) {
        super(type, parameters, FILTER_OPTIONS);
        this._parameters['type'] = this._type;
    }
}

class AudioEffect extends AudioNode {
    /**
     * @param {String} type - the type of effect
     * @param {List} parameters
     */
    constructor(type, parameters) {
        super(type, parameters, EFFECT_OPTIONS[type]); 
    }
}

class Instrument {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this._source = this._validateSource(graph);
        this._graph = this._reformatGraph(graph);
    }

    get source() {
        return this._source;
    }

    get graph() {
        const contents = this._graph.contents.asArray();
        const type = this._graph.type;
        return new Graph(new List(contents), type);
    }

    get info() {
        const info = {};
        this._graph.getVertices().contents.forEach(vertex => {
            if (!info[vertex.id]) {
                info[vertex.id] = {
                    'type': vertex.type,
                    'parameters': vertex.parameters,
                    'id': vertex.id,
                    'connections': []
                };
            }
        });
        return info;
    }

    get parameters() {
        const info = this.info;
        this._graph.getEdges().contents.forEach(e => {
            const src = e.at(1).id;
            const dst = e.at(2).id;
            info[src].connections.push(info[dst]);
        });

        const audioNodes = Object.keys(info).map(id => info[id]);
        const source = {
            'type': this._source.type,
            'parameters': this._source.parameters,
            'id': this._source.id,
            'connections': []
        };

        return { 'source': source, 'audioNodes': audioNodes };
    }
 
    /**
     * Ensures the provided graph is a valid audio-routing-graph
     *
     * @param {Graph} graph
     * @return {AudioNode} the source of the audio-routing-graph 
     */
    _validateSource(graph) {
        if (!(graph instanceof Graph)) {
            throw Error('error: instrument must be created from audio graph');
        }
        if (graph.type !== 'directed flow') {
            throw new Error('instrument must only have one source');
        }

        const source = graph.contents.at(1);
        if (!(source instanceof Oscillator || source instanceof Instrument)) {
            throw new Error('invalid audio source');
        }

        let index = 1;
        graph.contents.contents.forEach(node => {
            if (!(node instanceof AudioNode || node instanceof Graph || node instanceof Instrument)) {
                throw new Error('audio graph must only be made up of audio nodes');
            }
            if (node instanceof Instrument && index != 1) {
                throw new Error('Instruments can only be sources');
            }
            ++index;
        });
        
        // TODO osc can only be a source
        // TODO add a gain node check
        // TODO there must only be one destination
        return source instanceof Instrument ? source.source : source;
    }
    
    /**
     * Takes a NetsBlox graph as input and replaces each Instrument object with its equivalent graph.
     *
     * @param {Graph} graph
     * @return {Graph}
     */ 
    _reformatGraph(graph) {
        const contents = graph.contents;
        let node = undefined;
        for (let i = 1; i < contents.length(); ++i) {
            node = contents.at(i);
            if (node instanceof Instrument) {
                contents.put(node.graph, i);
            }
        }
        return new Graph(contents, graph.type);
    }
}

