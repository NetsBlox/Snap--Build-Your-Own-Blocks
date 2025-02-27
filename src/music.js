/**
 * @todo - create en edit beat button that pulls up all the variables can can be
 *         converted to a beat
 * @todo - create a function to detect if a variable can be a beat
 * @todo - create a separate object for editing beats so that editor state is not affected
 * @todo - style editor
 */

modules.music = '2025-February-21';

const DRUMS = [
    'crash', 
    'closed hi-hat', 
    'snare', 
    'floor tom', 
    'kick'
];

const NOTE_OFF = new Color(220, 220, 220, 1);

const NOTE_ON = new Color();

function ltos(list) {
    if (!Array.isArray(list)) {
        return '<l>' + list + '</l>';
    }

    if (list.length === 1) {
        return '<l>' + list[0] + '</l>';
    }

    var test = '<block s="reportNewList"><list>';
    list.forEach(element => test += ltos(element));
    test += '</list></block>';

    return test;
}

function createListBlock(list) {
    return '<block s="reportNewList">' + ltos(list) + '</block>'
}

function createCustomBlock(list) {
    const listBlock = createListBlock(list);
    return `
      <blocks>
        <block-definition collabId="item_-1_2" s="customBeat" type="reporter" category="music">
          <script>
            <block s="doReport">
              ${listBlock}
            </block>
          </script>
        </block-definition>
      </blocks>
    `;
}

var BeatDialogMorph;

////////// BeatDialogMorph //////////

BeatDialogMorph.prototype = new DialogBoxMorph();
BeatDialogMorph.prototype.constructor = BeatDialogMorph;
BeatDialogMorph.uber = DialogBoxMorph.prototype;

function BeatDialogMorph(target, action, enviornment) {
    this.init(target, action, enviornment);
}

BeatDialogMorph.prototype.init = function (target, action, enviornment) {
    // additional properties:
    this.isGlobal = true;
    this.beatLength = 8;
    this.state = {
        'crash': [0, 0, 0, 0, 0, 0, 0, 0],
        'closed hi-hat': [0, 0, 0, 0, 0, 0, 0, 0],
        'snare': [0, 0, 0, 0, 0, 0, 0, 0],
        'floor tom': [0, 0, 0, 0, 0, 0, 0, 0],
        'kick': [0, 0, 0, 0, 0, 0, 0, 0]
    }

    // initialize inherited properties
    BeatDialogMorph.uber.init.call(
        this,
        target,
        action,
        enviornment
    );

    // override inherited properties
    this.key = 'makeABeat';

    this.beatGrid = new BoxMorph();
    this.loadBeatGrid();
    this.fixBeatGirdLayout();
    this.add(this.beatGrid);

    this.fixLayout();
};

BeatDialogMorph.prototype.loadBeatGrid = function () {
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

            this.beatGrid.add(button);
        }
    });
};

BeatDialogMorph.prototype.fixBeatGirdLayout = function () {
    var buttonWidth = this.beatGrid.children[0].width(),
        buttonHeight = this.beatGrid.children[0].height(),
        xPadding = 10,
        yPadding = 2,
        border = 10,
        rows = DRUMS.length,
        i = 0,
        l = this.beatGrid.left() + xPadding,
        t = this.beatGrid.top(),
        row,
        col;
    
    this.beatGrid.children.forEach(button => {
        i += 1;
        row = Math.ceil(i / this.beatLength);
        col = (i - 1) % this.beatLength;

        button.setPosition(new Point(
            l + (col * xPadding + ((col) * buttonWidth)),
            t + (row * yPadding + ((row - 1) * buttonHeight) + border)
        ));
    });

    this.beatGrid.setExtent(new Point(
        (this.beatLength + 1) * xPadding + (this.beatLength) * buttonWidth,
        (this.beatLength + 1) * yPadding + rows * buttonHeight + 2 * border
    ));
};

BeatDialogMorph.prototype.getInput = function () {
    var processedBeat = [],
        spec;

    for (let i = 0; i < this.beatLength; ++i) {
        processedBeat.push([]);
    }

    DRUMS.forEach(drum => {
        for (let i = 0; i < this.beatLength; ++i) {
            if (this.state[drum][i] === 1) {
                processedBeat[i].push(drum);
            }
        } 
    });

    for (let i = 0; i < this.beatLength; ++i) {
        if (processedBeat[i].length === 0) {
            processedBeat[i].push('Rest');
        }
    }

    if (this.body instanceof InputFieldMorph) {
        spec = this.normalizeSpaces(this.body.getValue());
    }

    return { 'name': spec, 'block': createCustomBlock(processedBeat), 'state': this.state };
}

BeatDialogMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (this.body) {
        this.body.setPosition(this.position().add(new Point(
            this.padding,
            th + this.padding
        )));
        this.bounds.setWidth(this.body.width() + this.padding * 2);
        this.bounds.setHeight(
            this.body.height()
                + this.padding * 2
                + th
        );
        if (this.beatGrid) {
            this.beatGrid.setCenter(this.body.center());
            this.beatGrid.setTop(this.body.top());
            this.body.setTop(this.beatGrid.bottom() + this.padding);
            this.bounds.setHeight(
                this.height()
                    + this.beatGrid.height()
                    + this.padding
            );
        }
    } else if (this.head) { // when changing an existing prototype
        if (this.types) {
            this.types.fixLayout();
            this.bounds.setWidth(
                Math.max(this.types.width(), this.head.width())
                    + this.padding * 2
            );
        } else {
            this.bounds.setWidth(
                Math.max(this.beatGrid.width(), this.head.width())
                    + this.padding * 2
            );
        }
        this.head.setCenter(this.center());
        this.head.setTop(th + this.padding);
        this.bounds.setHeight(
            this.head.height()
                + this.padding * 2
                + th
        );
        if (this.beatGrid) {
            this.beatGrid.setCenter(this.center());
            this.beatGrid.setTop(this.head.bottom() + this.padding);
            this.bounds.setHeight(
                this.height()
                    + this.beatGrid.height()
                    + this.padding
            );
        }
    }

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.types) {
        this.types.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.types.height()
                    + this.padding
        );
        this.bounds.setWidth(Math.max(
            this.width(),
            this.types.width() + this.padding * 2
        ));
        this.types.setCenter(this.center());
        if (this.body) {
            this.types.setTop(this.body.bottom() + this.padding);
        } else if (this.categories) {
            this.types.setTop(this.categories.bottom() + this.padding);
        }
    }

    if (this.scopes) {
        this.scopes.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.scopes.height()
                    + (this.padding / 3)
        );
        this.bounds.setWidth(Math.max(
            this.width(),
            this.scopes.width() + this.padding * 2
        ));
        this.scopes.setCenter(this.center());
        if (this.types) {
            this.scopes.setTop(this.types.bottom() + (this.padding / 3));
        }
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