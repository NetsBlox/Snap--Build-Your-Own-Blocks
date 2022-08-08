var canvas;
var roboscapeSimCanvasInstance;
var resetButton;
var encryptButton;
var claimButton;
var claimLabel;
var updateRobotRowUI;
var beepsDisabled = false;

var updateLoopFunctions = [];

RoboScapeSimCanvasMorph.prototype = new DialogBoxMorph();
RoboScapeSimCanvasMorph.uber = DialogBoxMorph.prototype;
RoboScapeSimCanvasMorph.id = 0;

function RoboScapeSimCanvasMorph(title = 'Not connected') {
    this.init(title);
}

RoboScapeSimCanvasMorph.prototype.init = function (title) {
    this.minWidth = 700;
    this.minHeight = 300;

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        canvas.style.position = 'relative';
    } else {
        document.body.appendChild(canvas);
    }

    this.canvas = canvas;

    this.loaded = false;

    this.background = new Morph();
    this.background.setColor(new Color(200, 200, 200));

    RoboScapeSimCanvasMorph.uber.init.call(this);
    this.add(this.background);
    this.key = 'canvas' + RoboScapeSimCanvasMorph.id++;


    let spacerMorph = new Morph();
    spacerMorph.setWidth(10);
    spacerMorph.alpha = 0;

    let dividerMorph = new Morph();
    dividerMorph.setWidth(1);
    dividerMorph.setHeight(18);

    this.robotRow = new AlignmentMorph('row');
    this.robotRow.add(new TextMorph('Robot ID:'));

    this.robotsList = new InputFieldMorph(null, false, {}, true);
    this.robotRow.add(this.robotsList);

    this.robotRow.add(spacerMorph);
    this.robotRow.add(dividerMorph);

    spacerMorph = new Morph();
    spacerMorph.setWidth(5);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    resetButton = new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            socket.emit('resetRobot', this.robotsList.getValue(), SnapCloud.username || SnapCloud.clientId);
        } else {
            socket.emit('resetAll', SnapCloud.username || SnapCloud.clientId);
        }
    }, 'Reset');

    this.robotRow.add(resetButton);

    spacerMorph = new Morph();
    spacerMorph.setWidth(5);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    let chaseCamButton = new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            // Activate chase cam for robot
            followCam.lockedTarget = bodyMeshes['robot_' + this.robotsList.getValue()];
            scene.activeCamera = followCam;
        } else {
            // Reset to free camera
            scene.activeCamera = camera;
        }
    }, 'Chase Cam');
    this.robotRow.add(chaseCamButton);

    let fpsCamButton = new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            // Activate chase cam for robot
            firstPersonCam.targetRobot = this.robotsList.getValue();
            scene.activeCamera = firstPersonCam;
        } else {
            // Reset to free camera
            scene.activeCamera = camera;
        }
    }, 'First Person Cam');
    this.robotRow.add(fpsCamButton);

    this.robotRow.add(new PushButtonMorph(null, () => {
        scene.activeCamera = camera;
    }, 'Free Cam'));

    spacerMorph = new Morph();
    spacerMorph.setWidth(5);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    encryptButton = new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            socket.emit('robotButton', this.robotsList.getValue(), true, SnapCloud.username || SnapCloud.clientId);

            // Set unpress to happen automatically
            setTimeout(() => {
                socket.emit('robotButton', this.robotsList.getValue(), false, SnapCloud.username || SnapCloud.clientId);
            }, 250);
        }
    }, 'Encrypt');

    this.robotRow.add(encryptButton);

    spacerMorph = new Morph();
    spacerMorph.setWidth(5);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    claimButton = new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            if (claimButton.label.text == 'Claim') {
                socket.emit('claimRobot', this.robotsList.getValue(), true, SnapCloud.username || SnapCloud.clientId);
            } else {
                socket.emit('claimRobot', this.robotsList.getValue(), false, SnapCloud.username || SnapCloud.clientId);
            }
        }
    }, 'Claim');

    this.robotRow.add(claimButton);

    spacerMorph = new Morph();
    spacerMorph.setWidth(5);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    claimLabel = new TextMorph('Unclaimed');
    this.robotRow.add(claimLabel);

    this.add(this.robotRow);

    this.labelString = title;
    this.createLabel();
    this.addButton('hide', 'Close');

    this.fixLayout();
    this.rerender();

    updateRobotRowUI = () => {
        let robot = this.robotsList.getValue();
        if (robot == null || robot == '' || bodiesInfo['robot_' + robot] == null) {

            if (robot != null && robot != '' && bodiesInfo['robot_' + robot] == null) {
                this.robotsList.setChoice('');
            }

            chaseCamButton.hide();
            fpsCamButton.hide();
            claimButton.hide();
            claimButton.disable();
            claimLabel.hide();
            encryptButton.hide();
            encryptButton.disable();
        } else {
            chaseCamButton.show();
            fpsCamButton.show();
            encryptButton.show();

            if (bodiesInfo['robot_' + robot].claimedBy != null) {
                // If this is our robot, allow unclaim
                if (bodiesInfo['robot_' + robot].claimedBy === (SnapCloud.username || SnapCloud.clientId)) {
                    claimButton.label.text = 'Unclaim';
                    claimButton.enable();
                    encryptButton.enable();
                    resetButton.enable();
                } else {
                    claimButton.label.text = 'Claim';
                    claimButton.disable();
                    encryptButton.disable();
                    resetButton.disable();
                }
            } else {
                // No one claiming
                claimButton.label.text = 'Claim';
                claimButton.enable();
                encryptButton.enable();
                resetButton.enable();
            }

            claimButton.show();
            claimButton.fixLayout();
            claimButton.rerender();

            claimLabel.show();
            claimLabel.fixLayout();
            claimLabel.rerender();

            this.robotRow.fixLayout();
            this.robotRow.rerender();

            this.fixClaimLabel();
        }
    };

    this.robotRow.reactToChoice = (robot) => {
        console.log("robot " + robot + " selected");
        updateRobotRowUI();
    };
};

RoboScapeSimCanvasMorph.prototype.fixClaimLabel = function () {

    let robot = this.robotsList.getValue();

    if (bodiesInfo['robot_' + robot] != null && bodiesInfo['robot_' + robot].claimedBy != null) {
        claimLabel.text = 'Claimed by ' + bodiesInfo['robot_' + robot].claimedBy;
    } else {
        claimLabel.text = 'Unclaimed';
    }

    claimLabel.fixLayout();
    claimLabel.rerender();

    this.robotRow.fixLayout();
    this.robotRow.rerender();

    while (claimLabel.right() > this.right()) {
        claimLabel.text = claimLabel.text.substr(0, claimLabel.text.length - 4) + '...';
        claimLabel.fixLayout();
        claimLabel.rerender();
        this.robotRow.rerender();
    }
};

RoboScapeSimCanvasMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    this.bounds.setWidth(Math.max(this.minWidth, this.width()));
    this.bounds.setHeight(Math.max(this.minHeight, this.height()));

    this.background.setPosition(this.position().add(new Point(
        this.padding,
        th + this.padding
    )));

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    // Robot info row
    if (this.robotRow) {
        this.robotRow.setCenter(this.center());
        this.robotRow.setBottom(this.bottom() - this.padding);
        this.robotRow.setLeft(this.left() + this.padding);
        this.robotRow.fixLayout(false);
    }

    // Buttons at bottom of panel
    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.fixLayout();
        this.bounds.setHeight(
            this.height()
            + this.buttons.height()
            + this.padding
        );
        this.bounds.setWidth(
            Math.max(
                this.width(),
                this.buttons.width()
                + (2 * this.padding)
            )
        );
        this.buttons.setCenter(this.center());
        this.buttons.setBottom(this.bottom() - this.padding);
    }

    this.fixCanvasLayout();

    if (this.handle) {
        this.handle.rerender();
    }
};

RoboScapeSimCanvasMorph.prototype.fixCanvasLayout = function () {
    var width = this.width() - 2 * this.padding,
        bh = this.buttons ? this.buttons.height() : 0,
        lh = this.label ? this.label.height() : 0,
        rh = this.robotRow ? this.robotRow.height() : 0;
    height = this.height() - 4 * this.padding - bh - lh - rh;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.background.setExtent(new Point(width, height));
    this.setCanvasPosition();
};

RoboScapeSimCanvasMorph.prototype.showCanvas = function () {
    if (this.isVisible) {
        this.setCanvasPosition();
        this.canvas.style.display = 'inline';

        if (vrHelper && vrHelper.vrButton) {
            vrHelper.vrButton.style.display = 'inline';
        }
    }
};

RoboScapeSimCanvasMorph.prototype.hideCanvas = function () {
    this.canvas.style.display = 'none';

    if (vrHelper) {
        vrHelper.vrButton.style.display = 'none';
    }
};

RoboScapeSimCanvasMorph.prototype.show = function () {
    RoboScapeSimCanvasMorph.uber.show.call(this);
    this.showCanvas();
    this.robotRow.reactToChoice(this.robotsList.getValue());
};

RoboScapeSimCanvasMorph.prototype.hide = function () {
    RoboScapeSimCanvasMorph.uber.hide.call(this);
    this.hideCanvas();
};

RoboScapeSimCanvasMorph.prototype.prepareToBeGrabbed = function () {
    this.hideCanvas();
};

RoboScapeSimCanvasMorph.prototype.justDropped = function () {
    this.showCanvas();
};

RoboScapeSimCanvasMorph.prototype.setCanvasPosition = function () {
    var titleHeight = Math.floor(
        fontHeight(this.titleFontSize) + this.titlePadding * 2,
    ),
        top = this.top() + titleHeight + this.padding,
        left = this.left() + this.padding,
        width = this.width() - 2 * this.padding;

    this.canvas.style.left = left + 'px';
    this.canvas.style.top = top + 'px';
    this.canvas.style.width = width + 'px';

    if (vrHelper && vrHelper.vrButton) {
        vrHelper.vrButton.style.left = left + 'px';
        vrHelper.vrButton.style.top = top + 'px';
    }
};

RoboScapeSimCanvasMorph.prototype.popUp = function (world) {
    document.body.appendChild(this.canvas);
    RoboScapeSimCanvasMorph.uber.popUp.call(this, world);

    // Re-add canvas if missing
    if (canvas.parentNode == null) {
        document.body.appendChild(canvas);
    }

    this.setCanvasPosition();

    this.fixLayout();
    this.rerender();

    var myself = this;

    // Create handle
    if (!this.handle) {
        this.handle = new HandleMorph(
            this,
            280,
            220,
            this.corner,
            this.corner
        );

        this.handle.mouseDownLeft = function (pos) {
            myself.hideCanvas();
            HandleMorph.prototype.mouseDownLeft.call(this, pos);
            var stepFn = this.step;
            this.step = function () {
                stepFn.apply(this, arguments);

                myself.fixClaimLabel();

                if (!this.root().hand.mouseButton) {
                    myself.showCanvas();

                    if (engine) {
                        engine.resize();
                    }

                    myself.fixClaimLabel();
                }
            };
        };
    }
};

RoboScapeSimCanvasMorph.prototype.destroy = function () {
    this.canvas.remove();
    RoboScapeSimCanvasMorph.uber.destroy.call(this);
};

const resizeBabylonCanvas = function () {
    // Size 3d canvas to overlay stage
    canvas.style.width = stage.boundingBox().width() + 'px';
    canvas.style.height = stage.boundingBox().height() + 'px';
    canvas.style.left = stage.boundingBox().left() + 'px';
    canvas.style.top = stage.boundingBox().top() + 'px';
};

function updateCanvasTitle(result) {
    window.externalVariables.roboscapeSimCanvasInstance.labelString = result;
    window.externalVariables.roboscapeSimCanvasInstance.label.text = result;

    // Hack to update label text without causing fixLayout to change the dialog size
    let th = fontHeight(window.externalVariables.roboscapeSimCanvasInstance.titleFontSize) + window.externalVariables.roboscapeSimCanvasInstance.titlePadding * 2;
    window.externalVariables.roboscapeSimCanvasInstance.label.measureCtx.font = window.externalVariables.roboscapeSimCanvasInstance.label.font();
    let width = Math.max(
        window.externalVariables.roboscapeSimCanvasInstance.label.measureCtx.measureText(result).width + Math.abs(window.externalVariables.roboscapeSimCanvasInstance.label.shadowOffset.x),
        1
    );

    // Set label to be wide enough
    window.externalVariables.roboscapeSimCanvasInstance.label.bounds.setWidth(width);
    window.externalVariables.roboscapeSimCanvasInstance.label.fixLayout(true);

    // Fix label position
    window.externalVariables.roboscapeSimCanvasInstance.label.setCenter(window.externalVariables.roboscapeSimCanvasInstance.center());
    window.externalVariables.roboscapeSimCanvasInstance.label.setTop(window.externalVariables.roboscapeSimCanvasInstance.top() + (th - window.externalVariables.roboscapeSimCanvasInstance.label.height()) / 2);
    window.externalVariables.roboscapeSimCanvasInstance.label.fixLayout(true);
    window.externalVariables.roboscapeSimCanvasInstance.rerender();
};

const updateRobotsList = function (robots) {
    window.externalVariables.roboscapeSimCanvasInstance.robotsList.choices =
        robots.reduce((prev, info) => {
            prev[info.replace('robot_', '')] = info.replace('robot_', '');
            return prev;
        }, {});

    // Validate choice (if selected robot no longer exists, reset dropdown choice)
    if (!(window.externalVariables.roboscapeSimCanvasInstance.robotsList.getValue() in window.externalVariables.roboscapeSimCanvasInstance.robotsList.choices)) {
        window.externalVariables.roboscapeSimCanvasInstance.robotsList.setChoice('');
    }
};

const playNote = function (robot, frequency, duration) {
    if (beepsDisabled) {
        console.log(`Rejected beep to robot ${robot} at freq ${frequency} for ${duration} ms`);
        return;
    }

    // Stop an already playing note from this robot
    if (roboNotes[robot]) {
        roboNotes[robot].stop();
        delete roboNotes[robot];
    }

    let n = new Note(69);
    n.frequency = frequency;

    let gainNode = n.audioContext.createGain();
    gainNode.gain.value = 0.05;

    n.play(2, gainNode);
    setTimeout(() => { n.stop(); }, duration);
    roboNotes[robot] = n;
};

const getUsername = function () {
    return SnapCloud.username || SnapCloud.clientId;
}

disableRetinaSupport(); // Need to find fix for this

let tempCanvasVisibility = false;
updateLoopFunctions.push(() => {
    if (window.externalVariables.roboscapeSimCanvasInstance.overlappedMorphs().filter(morph => morph.parent == world).length > 1) {
        if (!tempCanvasVisibility) {
            // Hide canvas due to overlap
            tempCanvasVisibility = true;
            window.externalVariables.roboscapeSimCanvasInstance.hideCanvas();
        }
    } else {
        // Restore canvas state
        if (tempCanvasVisibility) {
            window.externalVariables.roboscapeSimCanvasInstance.showCanvas();
            tempCanvasVisibility = false;
        }
    }

    // Keep in-bounds
    if (window.externalVariables.roboscapeSimCanvasInstance.width() > world.width()) {
        window.externalVariables.roboscapeSimCanvasInstance.setWidth(world.width());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if (window.externalVariables.roboscapeSimCanvasInstance.height() > world.height()) {
        window.externalVariables.roboscapeSimCanvasInstance.setHeight(world.height());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if (window.externalVariables.roboscapeSimCanvasInstance.left() < 0) {
        window.externalVariables.roboscapeSimCanvasInstance.setLeft(0);
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if (window.externalVariables.roboscapeSimCanvasInstance.right() > world.width()) {
        window.externalVariables.roboscapeSimCanvasInstance.setRight(world.width());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if (window.externalVariables.roboscapeSimCanvasInstance.bottom() > world.height()) {
        window.externalVariables.roboscapeSimCanvasInstance.setBottom(world.height());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if (window.externalVariables.roboscapeSimCanvasInstance.top() < 0) {
        window.externalVariables.roboscapeSimCanvasInstance.setTop(0);
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
});

DictMenuInputFieldMorph.prototype = new InputFieldMorph();
DictMenuInputFieldMorph.uber = InputFieldMorph.prototype;

function DictMenuInputFieldMorph(text, isNumeric, choiceDict, isReadOnly) {
    this.init(text, isNumeric, choiceDict, isReadOnly);
}

DictMenuInputFieldMorph.prototype.dropDownMenu = async function () {
    var menu = await this.menuFromDict(this.choices, null);
    if (!menu) { // has already happened
        return;
    }

    if (menu.items.length > 0) {
        menu.popUpAtHand(this.world());
    }
};

DictMenuInputFieldMorph.prototype.userSetContents = function (aStringOrFloat) {
    this.setChoice(aStringOrFloat);
};

DictMenuInputFieldMorph.prototype.menuFromDict = async function (choices, noEmptyOption) {
    var key,
        menu = new MenuMorph(
            this.userSetContents,
            null,
            this,
            this.fontSize
        );

    function getImg(block) {
        return () => block.fullImage();
    }

    if (choices instanceof Function) {
        choices = await choices.call(this);
    } else if (isString(choices)) {
        choices = await this[choices]();
        if (!choices) { // menu has already happened
            return;
        }
    }

    if (!noEmptyOption) {
        menu.addItem(' ', null);
    }

    for (key in choices) {
        if (Object.prototype.hasOwnProperty.call(choices, key)) {
            if (key[0] === '~') {
                menu.addLine();
            } else if (key.indexOf('§_def') === 0) {
                menu.addItem(
                    this.doWithAlpha(1, getImg(choices[key])),
                    choices[key]
                );
            } else if (key.indexOf('§_') === 0) {
                // prefixing a key with '§_' only makes the menu item
                // appear when the user holds down the shift-key
                // use with care because mobile devices might only
                // have a "soft" keyboard that isn't always there
                if (this.world().currentKey === 16) { // shift
                    if (choices[key] instanceof Object &&
                        !(choices[key] instanceof Array) &&
                        (typeof choices[key] !== 'function')) {
                        menu.addMenu(
                            key.slice(2),
                            await this.menuFromDict(choices[key], true),
                            null,  // indicator
                        );
                    } else if (choices[key] instanceof Array &&
                        choices[key][0] instanceof Object &&
                        typeof choices[key][0] !== 'function') {
                        menu.addMenu(
                            key.slice(2),
                            await this.menuFromDict(choices[key][0], true),
                            null,  // indicator
                        );
                    } else {
                        menu.addItem(
                            key.slice(2),
                            choices[key],
                            null, // hint
                            null, // color
                            null, // bold
                            null, // italic
                            null, // doubleClickAction
                            null, // shortcut
                            !(choices[key] instanceof Array) &&
                            typeof choices[key] !== 'function' // verbatim?
                        );
                    }
                }
            } else if (choices[key] instanceof Object &&
                !(choices[key] instanceof Array) &&
                (typeof choices[key] !== 'function')) {
                menu.addMenu(
                    key,
                    await this.menuFromDict(choices[key], true),
                    null,  // indicator
                );
            } else if (choices[key] instanceof Array &&
                choices[key][0] instanceof Object &&
                typeof choices[key][0] !== 'function') {
                menu.addMenu(
                    key,
                    await this.menuFromDict(choices[key][0], true),
                    null,  // indicator
                );
            } else {
                menu.addItem(
                    key,
                    choices[key],
                    null, // hint
                    null, // color
                    null, // bold
                    null, // italic
                    null, // doubleClickAction
                    null, // shortcut
                    !(choices[key] instanceof Array) &&
                    typeof choices[key] !== 'function' // verbatim?
                );
            }
        }
    }
    return menu;
};