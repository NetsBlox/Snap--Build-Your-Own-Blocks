modules.music = '2025-February-21';

const DEFAULT_BEAT_LENGTH = 8;

const DRUMS = [
    'crash', 
    'closed hi-hat', 
    'snare', 
    'floor tom', 
    'kick'
];

const DEFAULT_STATE = {
    'crash': createEmptyArray(DEFAULT_BEAT_LENGTH),
    'closed hi-hat': createEmptyArray(DEFAULT_BEAT_LENGTH),
    'snare': createEmptyArray(DEFAULT_BEAT_LENGTH),
    'floor tom': createEmptyArray(DEFAULT_BEAT_LENGTH),
    'kick': createEmptyArray(DEFAULT_BEAT_LENGTH),
}

const NOTE_OFF = new Color(220, 220, 220, 1);

const NOTE_ON = new Color();

function isBeat(variable) {
    const value = variable.value;
    if (!(value instanceof List)) return false;
    for (let i = 0; i < value.contents.length; ++i) {
        if (!(value.contents[i] instanceof List)) return false;
        const slot = value.contents[i];
        for (let j = 0; j < slot.contents.length; ++j)
            if (DRUMS.indexOf(slot.contents[j]) === -1 && slot.contents[j] !== 'Rest') return false;
    }
    return true;
}

function createEmptyArray(size) {
    return new Array(size).fill(0);
}

function createState(list) {
    const beatLength = list.contents.length;
    let state = {
        'crash': createEmptyArray(beatLength),
        'closed hi-hat': createEmptyArray(beatLength),
        'snare': createEmptyArray(beatLength),
        'floor tom': createEmptyArray(beatLength),
        'kick': createEmptyArray(beatLength)
    }

    for (let i = 0; i < beatLength; ++i) {
        const slot = list.contents[i];
        if (slot.contents[0] === 'Rest')
            continue;
        slot.contents.forEach(drum => state[drum][i] = 1);
    }

    return state;
}

var BeatDialogMorph;
var BeatGridMorph;
var BeatLabelsMorph;

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
    this.state = state ? structuredClone(state) : structuredClone(DEFAULT_STATE);
    this.beatLength = this.state[Object.keys(this.state)[0]].length;
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

    this.beatGrid = new BeatGridMorph(this.beatLength, this.state);
    this.add(this.beatGrid);

    this.labels = new BeatLabelsMorph(this.beatGrid.height());
    this.add(this.labels);

    this.fixLayout();
};

BeatDialogMorph.prototype.getInput = function () {
    var processedBeat = [],
        spec,
        listState = new List();

    for (let i = 0; i < this.beatLength; ++i) {
        processedBeat.push([]);
    }

    DRUMS.forEach(drum => {
        for (let i = 0; i < this.beatLength; ++i) {
            if (this.beatGrid.state[drum][i] === 1) {
                processedBeat[i].push(drum);
            }
        } 
    });

    for (let i = 0; i < this.beatLength; ++i) {
        if (processedBeat[i].length === 0) {
            processedBeat[i].push('Rest');
        }
        listState.add(new List(processedBeat[i]));
    }

    if (this.body instanceof InputFieldMorph) {
        spec = this.normalizeSpaces(this.body.getValue());
    }

    return { 'name': spec, 'state': listState };
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

        this.beatGrid.setCenter(new Point(
            this.body.width() - this.beatGrid.width() / 2 + this.padding,
            this.body.center().y
        ));

        this.labels.setCenter(new Point(
            this.labels.width() / 2 + this.padding,
            this.body.center().y
        ));

        this.beatGrid.setTop(this.body.top());
        this.labels.setTop(this.body.top());
        this.body.setTop(this.beatGrid.bottom() + this.padding);
        this.bounds.setHeight(
            this.height()
                + this.beatGrid.height()
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

function BeatGridMorph (beatLength, state) {
    this.init(beatLength, state);
}

BeatGridMorph.prototype.init = function (beatLength, state) {
    this.beatLength = beatLength;
    this.state = structuredClone(state);

    BeatGridMorph.uber.init.call(this);

    DRUMS.forEach(drum => {
        for (let i = 0; i < this.beatLength; ++i) {
            let button = new PushButtonMorph(
                null,
                () => {
                    if (this.state[button.drum][button.beat] === 0) {
                        button.setColor(NOTE_ON);
                        this.state[button.drum][button.beat] = 1
                    } else {
                        button.setColor(NOTE_OFF);
                        this.state[button.drum][button.beat] = 0;
                    }
                },
                '  ',
            );

            button.drum = drum;
            button.beat = i;
            button.state = this.state[drum][i];

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
        rows = DRUMS.length,
        i = 0,
        l = this.left() + xPadding,
        t = this.top(),
        row,
        col;
    
    this.children.forEach(button => {
        i += 1;
        row = Math.ceil(i / this.beatLength);
        col = (i - 1) % this.beatLength;

        button.setPosition(new Point(
            l + (col * xPadding + ((col) * buttonWidth)),
            t + (row * yPadding + ((row - 1) * buttonHeight) + border)
        ));
    });

    this.setExtent(new Point(
        (this.beatLength + 1) * xPadding + (this.beatLength) * buttonWidth,
        (this.beatLength + 1) * yPadding + rows * buttonHeight + 2 * border
    ));
}

////////// BeatLabelsMorph //////////

BeatLabelsMorph.prototype = new BoxMorph();
BeatLabelsMorph.prototype.constructor = BeatLabelsMorph;
BeatLabelsMorph.uber = BoxMorph.prototype;

BeatLabelsMorph.prototype.fontSize = 12;
BeatLabelsMorph.prototype.color = PushButtonMorph.prototype.color;

function BeatLabelsMorph (height) {
    this.init(height);
}

BeatLabelsMorph.prototype.init = function (height) {
    BeatLabelsMorph.uber.init.call(this);
    
    this.border = 0;
    this.setHeight(height);
    this.setColor(BeatLabelsMorph.prototype.color);

    DRUMS.forEach(name => {
        this.add(new StringMorph(name.toUpperCase()));
    });

    this.fixLayout();
}

BeatLabelsMorph.prototype.fixLayout = function () {
    var rowHeight = this.height() / DRUMS.length,
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