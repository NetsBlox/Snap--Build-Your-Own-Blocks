var canvas;
var engine;
var stage;
var scene;
var camera;
var followCam;
var firstPersonCam;
var ui;
var vrHelper;
var roboscapeSimCanvasInstance;

var updateLoopFunctions = [];

RoboScapeSimCanvasMorph.prototype = new DialogBoxMorph();
RoboScapeSimCanvasMorph.uber = DialogBoxMorph.prototype;
RoboScapeSimCanvasMorph.id = 0;

function RoboScapeSimCanvasMorph(title = 'Canvas') {
    this.init(title);
}

RoboScapeSimCanvasMorph.prototype.init = function(title) {
    var myself = this;

    this.minWidth = 600;
    this.minHeight = 300;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'main-canvas';
    this.canvas.style.position = 'relative';
    canvas = this.canvas;

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
    spacerMorph.setWidth(10);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);


    this.robotRow.add(new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            console.log('reset');
            socket.emit('resetRobot', this.robotsList.getValue());
        }
    }, 'Reset'));
    
    spacerMorph = new Morph();
    spacerMorph.setWidth(10);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);
    
    this.robotRow.add(new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            console.log('button');
            socket.emit('robotButton', this.robotsList.getValue(), true);
            
            // Set unpress to happen automatically
            setTimeout(() => {
                socket.emit('robotButton', this.robotsList.getValue(), false);
            }, 250);
        }
    }, 'Encrypt'));
    
    spacerMorph = new Morph();
    spacerMorph.setWidth(10);
    spacerMorph.alpha = 0;

    this.robotRow.add(spacerMorph);

    this.robotRow.add(new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            // Activate chase cam for robot
            followCam.lockedTarget = bodyMeshes['robot_' + this.robotsList.getValue()];
            scene.activeCamera = followCam;
        } else {
            // Reset to free camera
            scene.activeCamera = camera;
        }
    }, 'Chase Cam'));

    this.robotRow.add(new PushButtonMorph(null, () => {
        if (this.robotsList.getValue() != '') {
            // Activate chase cam for robot
            firstPersonCam.targetRobot = this.robotsList.getValue();
            scene.activeCamera = firstPersonCam;
        } else {
            // Reset to free camera
            scene.activeCamera = camera;
        }
    }, 'First Person Cam'));

    this.add(this.robotRow);

    this.labelString = title;
    this.createLabel();
    this.addButton('hide', 'Close');
    this.rerender();
    this.fixLayout();
    this.rerender();
};

RoboScapeSimCanvasMorph.prototype.fixLayout = function() {
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

    this.fixCanvasLayout();

    // Robot info row
    if (this.robotRow) {
        this.robotRow.setCenter(this.center());
        this.robotRow.setBottom(this.bottom() - this.padding);
        this.robotRow.setLeft(this.left() + this.padding);
        this.robotRow.fixLayout();
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

    if (this.handle) {
        this.handle.rerender();
    }
};

RoboScapeSimCanvasMorph.prototype.fixCanvasLayout = function() {
    var width = this.width() - 2 * this.padding,
        bh = this.buttons ? this.buttons.height() : 0,
        lh = this.label ? this.label.height() : 0,
        height = this.height() - 4 * this.padding - bh - lh;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.background.setExtent(new Point(width, height));
    this.setCanvasPosition();
};

RoboScapeSimCanvasMorph.prototype.showCanvas = function () {
    if (this.isVisible) {
        this.setCanvasPosition();
        this.canvas.style.display = 'inline';
    
        if (vrHelper) {
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

RoboScapeSimCanvasMorph.prototype.show = function() {
    RoboScapeSimCanvasMorph.uber.show.call(this);
    this.showCanvas();
};

RoboScapeSimCanvasMorph.prototype.hide = function() {
    RoboScapeSimCanvasMorph.uber.hide.call(this);
    this.hideCanvas();
};

RoboScapeSimCanvasMorph.prototype.prepareToBeGrabbed = function() {
    this.hideCanvas();
};

RoboScapeSimCanvasMorph.prototype.justDropped = function() {
    this.showCanvas();
};

RoboScapeSimCanvasMorph.prototype.setCanvasPosition = function() {
    var titleHeight = Math.floor(
            fontHeight(this.titleFontSize) + this.titlePadding * 2,
        ),
        top = this.top() + titleHeight + this.padding,
        left = this.left() + this.padding,
        width = this.width() - 2*this.padding;

    this.canvas.style.left = left + 'px';
    this.canvas.style.top = top + 'px';
    this.canvas.style.width = width + 'px';
    
    if (vrHelper) {
        vrHelper.vrButton.style.left = left + 'px';
        vrHelper.vrButton.style.top = top + 'px';
    } 
};

RoboScapeSimCanvasMorph.prototype.popUp = function(world) {
    document.body.appendChild(this.canvas);
    RoboScapeSimCanvasMorph.uber.popUp.call(this, world);
    this.setCanvasPosition();

    var myself = this;

    // Resize handle
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
        this.step = function() {
            stepFn.apply(this, arguments);
            if (!this.root().hand.mouseButton) {
                myself.showCanvas();

                if (engine) {
                    engine.resize();
                }
            }
        };
    };
};

RoboScapeSimCanvasMorph.prototype.destroy = function() {
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

const activateBabylon = async function () {

    if (!canvas) {
        return;
    }

    // Wait for Babylon to load
    if (typeof BABYLON == 'undefined') {
        setTimeout(activateBabylon, 200);
        return;
    }
    
    engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    stage = world.children[0].children.find(c => c.name == 'Stage');

    scene = new BABYLON.Scene(engine);
    

    // Parameters : name, position, scene
    camera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(4, 10, -4), scene);
    camera.speed = 0.4;
    camera.minZ = 0.01;
    
    // Attach the camera to the canvas
    camera.attachControl(canvas, true);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    
    followCam = new BABYLON.FollowCamera('followcam', new BABYLON.Vector3(5, 5, 5), scene);
    followCam.heightOffset = 2;
    followCam.radius = 3;
    followCam.rotationOffset = 0;
    followCam.cameraAcceleration = 0.25;
    followCam.maxCameraSpeed = 100;

    firstPersonCam = new BABYLON.UniversalCamera('firstPersonCam', new BABYLON.Vector3(5, 5, 5), scene, false);
    firstPersonCam.minZ = 0.01;

    light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    
    
    engine.runRenderLoop(function () {

        let frameTime = performance.now();
        
        for (let func of updateLoopFunctions) {
            func(frameTime);
        }

        // Limit camera
        const cameraMinY = 0.1;
        if (camera.position.y < cameraMinY) {
            camera.position.y = cameraMinY;
        }

        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
    });

    // Initialize UI texture
    ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    setTimeout(() => {
        // Enable VR if available
        if ('getVRDisplays' in navigator || 'xr' in navigator){
            vrHelper = scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useXR: true });
        }
    }, 1500);
};

const addBlock = async function (width, height, depth = -1) {
    if(depth > 0){
        return await BABYLON.MeshBuilder.CreateBox('box', {width, depth: depth, height: height}, scene);
    } 

    return await BABYLON.MeshBuilder.CreateBox('box', {width, depth: height, height: 1}, scene);
};

// Load Babylon
var babylonScripts = ['https://preview.babylonjs.com/babylon.js','https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js', 'https://preview.babylonjs.com/gui/babylon.gui.min.js'];
var scriptPromises = [];

for (let file of babylonScripts) {
    scriptPromises.push(new Promise((resolve, reject) => {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = file;
        script.async = false;
        script.onload = resolve;
        document.body.appendChild(script);
    }));
}

disableRetinaSupport(); // Need to find fix for this

// Wait for scripts to load
Promise.all(scriptPromises).then(() => {
    setTimeout(() => {
        if (!window.externalVariables.roboscapeSimCanvasInstance) {
            if (!roboscapeSimCanvasInstance) {
                roboscapeSimCanvasInstance = new RoboScapeSimCanvasMorph();
            }
            (window.externalVariables.roboscapeSimCanvasInstance = roboscapeSimCanvasInstance).popUp(world);
            window.externalVariables.roboscapeSimCanvasInstance.hide();
        }
    }, 200);
});
