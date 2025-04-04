modules.music = '2025-February-21';

const NOTE_OFF = new Color(220, 220, 220, 1);

const NOTE_ON = new Color();

const DRUMS_MAX = 8;

const DRUMS_MIX = 1;

const DRUMS = [
    'kick',  'kick #2',  'snare',  'side stick snare',
    'open snare',  'closed hi-hat', 'clap', 'tom',
    'rack tom',  'floor tom',  'crash', 'crash #2',
    'ride', 'ride #2',  'tamborine',
];

const DRUM_MAP = takenDrums => {
    let temp = {};
    DRUMS.forEach(drum => {
        if (takenDrums.indexOf(drum) === -1) {
            temp[drum] = drum;
        }
    })
    return temp;
}

function DrumState(state) {
    this.state = state ? state.state : [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ];
    this.length = state ? state.length : 8;
    this.drums = state ? state.drums : ['crash', 'closed hi-hat', 'snare', 'floor tom', 'kick'];
}

DrumState.prototype.drumOn = function (drumIndex, noteIndex) {
    this.state[drumIndex][noteIndex] = 1;
}

DrumState.prototype.drumOff = function (drumIndex, noteIndex) {
    this.state[drumIndex][noteIndex] = 0;
}

DrumState.prototype.getDrumIndex = function (drum) {
    return this.drums.indexOf(drum);
}

DrumState.prototype.getProcessedBeat = function (labels) {
    var processedBeat = [],
        listState = new List();

    for (let i = 0; i < labels.children.length; i++) {
        this.drums[i] = labels.children[i].getValue();
    }

    for (let i = 0; i < this.length; ++i) {
        processedBeat.push([]);
    }

    for (let i = 0; i < this.drums.length; ++i) {
        for (let j = 0; j < this.length; ++j) {
            if (this.state[i][j] === 1) {
                processedBeat[j].push(this.drums[i]);
            }
        }
    }

    for (let i = 0; i < this.length; ++i) {
        if (processedBeat[i].length === 0) {
            processedBeat[i].push('Rest');
        }
        listState.add(new List(processedBeat[i]));
    }

    return listState;
}

DrumState.prototype.removeBeat = function () {
    for (let i = 0; i < this.drums.length; ++i) {
        this.state[i].length -= 1;
    }
    this.length -= 1;
}

DrumState.prototype.addBeat = function () {
    for (let i = 0; i < this.drums.length; ++i) {
        this.state[i].push(0);
    }
    this.length += 1;
}

DrumState.prototype.addDrum = function () {
    const newDrum = Object.keys(DRUM_MAP(this.drums))[0];
    this.drums.push(newDrum);
    this.state.push(createEmptyArray(this.length));
}

DrumState.prototype.removeDrum = function () {
    this.drums.length -= 1;
    this.state.length -= 1;
}

function isBeat(variable) {
    const value = variable.value;
    if (!(value instanceof List)) return false;
    if (value.length() < 2) return false;
    for (let i = 0; i < value.contents.length; ++i) {
        if (!(value.contents[i] instanceof List)) return false;
        const slot = value.contents[i];
        if (slot.contents.length > DRUMS_MAX) return false;
        for (let j = 0; j < slot.contents.length; ++j)
            if (DRUMS.indexOf(slot.contents[j]) === -1 && slot.contents[j] !== 'Rest') return false;
    }
    return true;
}

function createEmptyArray(size) {
    return new Array(size).fill(0);
}

function createState(list) {
    let length = list.contents.length;
    let drums = [];
    let state = [];

    for (let i = 0; i < length; ++i) {
        const slot = list.contents[i];
        if (slot.contents[0] === 'Rest') {
            continue;
        }

        for (let j = 0; j < slot.contents.length; ++j) {
            if (drums.indexOf(slot.contents[j]) == -1) {
                drums.push(slot.contents[j])
                state.push(createEmptyArray(length));
            }
        }
    }

    for (let i = 0; i < length; ++i) {
        const slot = list.contents[i];
        if (slot.contents[0] === 'Rest') {
            continue;
        }

        slot.contents.forEach(drum => {
            const drumIndex = drums.indexOf(drum);
            state[drumIndex][i] = 1;
        });
    }

    if (state.length === 0) {
        state = [[0, 0, 0, 0, 0, 0, 0, 0]];
        length = 8;
        drums = ['kick'];
    }

    const temp = new DrumState();
    temp.state = state;
    temp.length = length;
    temp.drums = drums;

    return temp;
}

var BeatDialogMorph;
var BeatGridMorph;
var BeatLabelsMorph;
var BeatLengthToggleMorph;
var DrumCountToggleMorph;

////////// BeatDialogMorph //////////

BeatDialogMorph.prototype = new DialogBoxMorph();
BeatDialogMorph.prototype.constructor = BeatDialogMorph;
BeatDialogMorph.uber = DialogBoxMorph.prototype;

function BeatDialogMorph(target, action, enviornment, mode = 'new', name = '', state) {
    this.init(target, action, enviornment, mode, name, state);
}

BeatDialogMorph.prototype.init = function (target, action, enviornment, mode, name, state) {
    // additional properties:
    this.isGlobal = true;
    this.state = state ? new DrumState(state) : new DrumState();
    this.mode = mode;
    this.name = name;

    // initialize inherited properties
    BeatDialogMorph.uber.init.call(
        this,
        target,
        action,
        enviornment
    );

    // override inherited properties
    this.key = 'makeABeat';

    this.beatGrid = new BeatGridMorph(this);
    this.add(this.beatGrid);

    this.labels = new BeatLabelsMorph(this);
    this.add(this.labels);

    this.drumCountToggle = new DrumCountToggleMorph(this);
    this.add(this.drumCountToggle);

    this.beatLengthToggle = new BeatLengthToggleMorph(this);
    this.add(this.beatLengthToggle);

    this.fixLayout();
};

BeatDialogMorph.prototype.getInput = function () {
    var listState = this.state.getProcessedBeat(this.labels),
        spec;
    if (this.body instanceof InputFieldMorph) {
        spec = this.normalizeSpaces(this.body.getValue());
    }
    return { 'name': spec, 'state': listState };
}

BeatDialogMorph.prototype.updateState = function (state) {
    this.state = state;
    this.beatGrid.updateState(state);
    this.labels.updateState(state);
    this.fixLayout();
}

BeatDialogMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (this.body) {
        this.body.setPosition(this.position().add(new Point(
            this.padding,
            th + this.padding
        )));
        this.body.setWidth(this.beatGrid.width() + this.labels.width());

        this.bounds.setWidth(this.body.width() + this.padding * 2);
        this.bounds.setHeight(
            this.body.height()
                + this.padding * 2
                + th
        );

        this.beatLengthToggle.setCenter(this.body.center());

        this.beatGrid.setTop(this.body.top());
        this.beatGrid.setLeft(this.body.left() + this.body.width() - this.beatGrid.width())
        this.labels.setTop(this.body.top());
        this.labels.setLeft(this.body.left());
        this.drumCountToggle.setTop(this.labels.bottom() + this.padding);
        this.drumCountToggle.setLeft(this.body.left());
        this.beatLengthToggle.setTop(this.drumCountToggle.bottom());
        this.body.setTop(this.beatLengthToggle.bottom() + this.padding);
        this.bounds.setHeight(
            this.height()
                + this.beatGrid.height()
                + this.beatLengthToggle.height()
                + this.drumCountToggle.height()
                + this.padding
        );

        this.body.children[0].defaultContents = this.name;
        this.body.children[0].children[0].text = this.name;
    }

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.buttons.height()
                    + this.padding
        );
        this.buttons.setCenter(this.center());
        this.buttons.setBottom(this.bottom() - this.padding);
    }

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
};

////////// BeatGridMorph //////////

BeatGridMorph.prototype = new BoxMorph();
BeatGridMorph.prototype.constructor = BeatGridMorph;
BeatGridMorph.uber = BoxMorph.uber;

function BeatGridMorph (parent) {
    this.init(parent);
}

BeatGridMorph.prototype.init = function (parent) {
    this.parent = parent;
    BeatGridMorph.uber.init.call(this);
    this.updateState(parent.state);
}

BeatGridMorph.prototype.updateState = function (state) {
    this.state = state;
    this.renderState();
}

BeatGridMorph.prototype.renderState = function () {
    this.children = [];

    const tempState = structuredClone(this.state);
    
    this.state.drums.forEach(drum => {
        for (let i = 0; i < this.state.length; ++i) {
            let button = new PushButtonMorph(
                null,
                () => {
                    if (tempState.state[button.drumIndex][button.beat] === 0) {
                        this.state.drumOn(button.drumIndex, button.beat);
                    } else {
                        this.state.drumOff(button.drumIndex, button.beat);
                    }
                    this.renderState();
                },
                '  ',
            );

            button.drum = drum;
            button.drumIndex = this.state.getDrumIndex(drum);
            button.beat = i;
            button.state = this.state.state[button.drumIndex][i];

            if (button.state === 0) {
                button.setColor(NOTE_OFF);
            } else {
                button.setColor(NOTE_ON);
            }

            this.add(button);
        }
    });

    this.fixLayout();
}

BeatGridMorph.prototype.fixLayout = function () {
    var buttonWidth = this.children[0].width(),
        buttonHeight = this.children[0].height(),
        xPadding = 10,
        yPadding = 2,
        border = 10,
        rows = this.state.drums.length,
        i = 0,
        l = this.left() + xPadding,
        t = this.top(),
        row,
        col;
    
    this.children.forEach(button => {
        i += 1;
        row = Math.ceil(i / this.state.length);
        col = (i - 1) % this.state.length;

        button.setPosition(new Point(
            l + (col * xPadding + ((col) * buttonWidth)),
            t + (row * yPadding + ((row - 1) * buttonHeight) + border)
        ));
    });

    this.bounds.setWidth((this.state.length + 1) * xPadding + (this.state.length) * buttonWidth);
    this.bounds.setHeight(rows * buttonHeight + 2 * border + xPadding);
}

////////// BeatLabelsMorph //////////

BeatLabelsMorph.prototype = new BoxMorph();
BeatLabelsMorph.prototype.constructor = BeatLabelsMorph;
BeatLabelsMorph.uber = BoxMorph.prototype;

BeatLabelsMorph.prototype.fontSize = 12;
BeatLabelsMorph.prototype.color = PushButtonMorph.prototype.color;

function BeatLabelsMorph (parent) {
    this.init(parent);
}

BeatLabelsMorph.prototype.init = function (parent) {
    BeatLabelsMorph.uber.init.call(this);
    this.parent = parent;
    this.updateState(parent.state);
}

BeatLabelsMorph.prototype.updateState = function (state) {
    this.state = state;
    this.renderState();
}

BeatLabelsMorph.prototype.renderState = function () {
    this.setHeight(this.parent.beatGrid.height());
    this.setColor(BeatLabelsMorph.prototype.color);
    this.border = 0;
    this.children = [];
    for (let i = 0; i < this.state.drums.length; ++i) {
        let label = new InputFieldMorph(
            this.state.drums[i], 
            false, 
            () => {
                this.state.drums[i] = label.getValue();
                return DRUM_MAP(this.state.drums);
            }, 
            true
        );
        this.add(label);
    }
    this.fixLayout();
}

BeatLabelsMorph.prototype.fixLayout = function () {
    var rowHeight = this.height() / this.state.drums.length,
        l = this.left() + 2;
        t = this.top() + 10,
        i = 0
        maxLabelWidth = 0;

    this.children.forEach(label => {
        i += 1;
        label.setPosition(new Point(
            l,
            t + ((i - 1) * (rowHeight - 2))
        ));

        if (label.width() > maxLabelWidth) {
            maxLabelWidth = label.width();
        }
    });

    this.setWidth(maxLabelWidth + 10);
}

////////// BeatLengthToggleMorph //////////

BeatLengthToggleMorph.prototype = new BoxMorph();
BeatLengthToggleMorph.prototype.constructor = BeatLengthToggleMorph;
BeatLengthToggleMorph.uber = BoxMorph.prototype;

BeatLengthToggleMorph.prototype.fontSize = 12;
BeatLengthToggleMorph.prototype.color = PushButtonMorph.prototype.color;

function BeatLengthToggleMorph (parent) {
    this.init(parent);
}

BeatLengthToggleMorph.prototype.init = function (parent) {
    this.parent = parent;
    
    BeatLengthToggleMorph.uber.init.call(this);
    
    this.border = 0;
    this.setColor(BeatLengthToggleMorph.prototype.color);

    this.label = new StringMorph('Number of Beats:');
    this.add(this.label);

    this.decrement = new PushButtonMorph(
        null,
        () => {
            const temp = new DrumState(this.parent.state);
            if (temp.length > 2) {
                temp.removeBeat();
            }
            this.parent.updateState(temp);
        },
        ' - '
    );
    this.add(this.decrement);

    this.increment = new PushButtonMorph(
        null,
        () => {
            const temp = new DrumState(this.parent.state);
            temp.addBeat();
            this.parent.updateState(temp);
        },
        ' + '
    );
    this.add(this.increment);

    this.fixLayout();
}

BeatLengthToggleMorph.prototype.fixLayout = function () {
    var l = this.left(),
        t = this.top();

    this.increment.setHeight(this.label.height());
    this.decrement.setHeight(this.label.height());
    
    this.label.setPosition(new Point(l, t));
    this.decrement.setPosition(new Point(
        l + this.label.width() + 10,
        t - 2
    ));
    this.increment.setPosition(new Point(
        l + this.decrement.left() + this.increment.width() + 2,
        t - 2
    ));

    this.setWidth(this.decrement.left() + this.decrement.width() - l);
    this.setHeight(this.label.height());
}

////////// BeatLengthToggleMorph //////////

DrumCountToggleMorph.prototype = new BoxMorph();
DrumCountToggleMorph.prototype.constructor = DrumCountToggleMorph;
DrumCountToggleMorph.uber = BoxMorph.prototype;

DrumCountToggleMorph.prototype.fontSize = 8;
DrumCountToggleMorph.prototype.color = PushButtonMorph.prototype.color;

function DrumCountToggleMorph (parent) {
    this.init(parent);
}

DrumCountToggleMorph.prototype.init = function (parent) {
    this.parent = parent;
    
    DrumCountToggleMorph.uber.init.call(this);
    
    this.border = 0;
    this.setColor(DrumCountToggleMorph.prototype.color);

    this.removeDrum = new PushButtonMorph(
        null,
        () => {
            const temp = new DrumState(this.parent.state);
            if (temp.drums.length > DRUMS_MIX) {
                temp.removeDrum();
            }
            this.parent.updateState(temp);
        },
        'remove drum'
    );
    this.add(this.removeDrum);

    this.addDrum = new PushButtonMorph(
        null,
        () => {
            const temp = new DrumState(this.parent.state);
            if (temp.drums.length < DRUMS_MAX) {
                temp.addDrum();
            }
            this.parent.updateState(temp);
        },
        'add drum'
    );
    this.add(this.addDrum);

    this.fixLayout();
}

DrumCountToggleMorph.prototype.fixLayout = function () {
    var l = this.left(),
        t = this.top();
    
    this.removeDrum.setPosition(new Point(
        l,
        t - 2
    ));
    this.addDrum.setPosition(new Point(
        l + this.removeDrum.width() + 2,
        t - 2
    ));

    this.setWidth(this.removeDrum.left() + this.addDrum.width() - l);
}