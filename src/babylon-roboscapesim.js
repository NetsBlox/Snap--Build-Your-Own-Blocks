var canvas;
var engine;
var stage;
var scene;
var camera;
var followCam;
var firstPersonCam;
var ambientLight;
var ui;
var vrHelper;
var roboscapeSimCanvasInstance;
var shadowGenerator;
var optimizer;
var resetButton;
var encryptButton;
var claimButton;
var claimLabel;
var updateRobotRowUI;

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
        if (robot == null || robot == '') {
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

    if (bodiesInfo['robot_' + robot].claimedBy != null) {
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

var textStackPanel;
const textBlocks = {};

const activateBabylon = async function () {

    if (!canvas) {
        return;
    }

    // Wait for Babylon to load
    if (typeof BABYLON == 'undefined') {
        setTimeout(activateBabylon, 200);
        return;
    }

    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    stage = world.children[0].children.find(c => c.name == 'Stage');

    scene = new BABYLON.Scene(engine);

    
    // Optimizer
    var options = BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed();
    optimizer = new BABYLON.SceneOptimizer(scene, options);
    
    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    textStackPanel = new BABYLON.GUI.StackPanel();    
    textStackPanel.setPadding(20, 20, 20, 20);
    textStackPanel.spacing = 20;
    textStackPanel.verticalAlignment = "top";
    advancedTexture.addControl(textStackPanel);   

    // Parameters : name, position, scene
    camera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(0, 6, -2), scene);
    camera.speed = 0.35;
    camera.minZ = 0.01;
    camera.maxZ = 200;

    // Attach the camera to the canvas
    camera.attachControl(canvas, true);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));

    
	scene.onKeyboardObservable.add((kbInfo) => {
		switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                
                const camSpeed = 0.005;
                
                // Keyboard camera controls for touchscreen usability
				switch (kbInfo.event.key) {
                    case "u":
                    case "U":
                        camera.cameraRotation.x -= camSpeed;
                    break
                    case "j":
                    case "J":
                        camera.cameraRotation.x += camSpeed;
                    break
                    case "h":
                    case "H":
                        camera.cameraRotation.y -= camSpeed;
                    break
                    case "k":
                    case "K":
                        camera.cameraRotation.y += camSpeed;
                    break
                }
			break;
		}
	});

    followCam = new BABYLON.FollowCamera('followcam', new BABYLON.Vector3(5, 5, 5), scene);
    followCam.heightOffset = 1.25;
    followCam.radius = 2;
    followCam.rotationOffset = 0;
    followCam.cameraAcceleration = 0.2;
    followCam.maxCameraSpeed = 50;
    followCam.minZ = 0.01;
    followCam.maxZ = 200;

    firstPersonCam = new BABYLON.UniversalCamera('firstPersonCam', new BABYLON.Vector3(5, 5, 5), scene, false);
    firstPersonCam.minZ = 0.01;
    firstPersonCam.maxZ = 150;

    light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-0.25, -1, 0), scene);
    light.intensity = 0.8;
    ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.5;
    ambientLight.shadowEnabled = false;

    // Shadow generator
    shadowGenerator = new BABYLON.CascadedShadowGenerator(1024, light);
    shadowGenerator.bias = 0.007;
    shadowGenerator.cascadeBlendPercentage = 0.15;
    shadowGenerator.lambda = 0.9;
    shadowGenerator.stabilizeCascades = true;
    shadowGenerator.filteringQuality = 1;
    shadowGenerator.filter = 6;
    shadowGenerator.frustumEdgeFalloff = 1;
    shadowGenerator.shadowMaxZ = 50;

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
    window.addEventListener('resize', function () {
        engine.resize();
    });

    // Initialize UI texture
    ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    setTimeout(() => {
        // Enable VR if available
        if ('getVRDisplays' in navigator || 'xr' in navigator) {
            vrHelper = scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useXR: true });
        }
    }, 1500);
};

const addBlock = async function (width, height, depth = -1, castShadows = true, receiveShadows = true) {
    var block;

    if (depth > 0) {
        block = await BABYLON.MeshBuilder.CreateBox('box', { width, depth: depth, height: height }, scene);
    } else {
        block = await BABYLON.MeshBuilder.CreateBox('box', { width, depth: height, height: 1 }, scene);
    }

    if (castShadows) {
        shadowGenerator.addShadowCaster(block);
    }

    block.receiveShadows = receiveShadows;
    return block;
};


var assetsDir;

if (window.origin.includes('localhost')) {
    assetsDir = 'http://localhost:8080/src/';
} else {
    assetsDir = 'https://extensions.netsblox.org/extensions/RoboScapeOnline/assets/';
}

/**
 * Import mesh and add it to scene
 * @returns Mesh object
 */
const addMesh = async function (name) {
    try {
        imported = await BABYLON.SceneLoader.ImportMeshAsync('', assetsDir, name);

        shadowGenerator.addShadowCaster(imported.meshes[0], true);
        return imported.meshes[0];
    } catch (e) {
        console.log(e);
        return addBlock(1, 1);
    }
};

/**
 * Create a new plane with text written on its texture
 * @param {string} text Text to display on label
 * @param {string} font Font to write text in
 * @param {string} color Color of text
 * @param {boolean} outline Should black outline be added around text for visibility
 * @returns Plane with dynamic texture material applied
 */
const createLabel = function (text, font = 'Arial', color = '#ffffff', outline = true) {
    // Set font
    var font_size = 48;
    var font = 'bold ' + font_size + 'px ' + font;

    // Set height for plane
    var planeHeight = 3;

    // Set height for dynamic texture
    var DTHeight = 1.5 * font_size; //or set as wished

    // Calcultae ratio
    var ratio = planeHeight / DTHeight;

    //Use a temporary dynamic texture to calculate the length of the text on the dynamic texture canvas
    var temp = new BABYLON.DynamicTexture('DynamicTexture', 64, scene);
    var tmpctx = temp.getContext();
    tmpctx.font = font;
    var DTWidth = tmpctx.measureText(text).width + 8;

    // Calculate width the plane has to be 
    var planeWidth = DTWidth * ratio;

    //Create dynamic texture and write the text
    var dynamicTexture = new BABYLON.DynamicTexture('DynamicTexture', { width: DTWidth + 8, height: DTHeight + 8 }, scene, false);
    var mat = new BABYLON.StandardMaterial('mat', scene);
    mat.diffuseTexture = dynamicTexture;
    mat.ambientColor = new BABYLON.Color3(1, 1, 1);
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);

    // Create outline
    if (outline) {
        dynamicTexture.drawText(text, 2, DTHeight - 4, font, '#111111', null, true);
        dynamicTexture.drawText(text, 4, DTHeight - 2, font, '#111111', null, true);
        dynamicTexture.drawText(text, 6, DTHeight - 4, font, '#111111', null, true);
        dynamicTexture.drawText(text, 4, DTHeight - 6, font, '#111111', null, true);
    }

    // Draw text
    dynamicTexture.drawText(text, 4, DTHeight - 4, font, color, null, true);

    dynamicTexture.hasAlpha = true;
    dynamicTexture.getAlphaFromRGB = true;

    //Create plane and set dynamic texture as material
    var plane = BABYLON.MeshBuilder.CreatePlane('plane', { width: planeWidth, height: planeHeight }, scene);
    plane.material = mat;

    return plane;
};
 
/**
 * Create a TextBlock in the 3D view's overlay.
 * If a TextBlock already has the id, that TextBlock's text and timeout will be updated.
 * 
 * @param {string} text Text to display in TextBlock
 * @param {string} id ID of TextBlock
 * @param {number | boolean} timeout TextBlock will be removed after timeout ms, or never if timeout is falsey.
 */
const addOrUpdateText = function (text, id, timeout) {

    if (!Object.keys(textBlocks).includes(id)) {
        var textBlock = new BABYLON.GUI.TextBlock("textblock_" + (id ?? Math.round(Math.random() * 10000000)));
        textBlock.text = text;
        textBlock.heightInPixels = 24;
        textBlock.outlineColor = "#2226";
        textBlock.outlineWidth = 3;
        textBlock.color = "#FFF";
        textBlock.fontSizeInPixels = 20;

        textStackPanel.addControl(textBlock);
        textBlocks[id] = textBlock;
    } else {
        textBlocks[id].text = text;
    }

    if (timeout) {
        if (textBlocks[id].timeout) {
            clearTimeout(textBlocks[id].timeout);
        }

        textBlocks[id].timeout = setTimeout(() => {
            textStackPanel.removeControl(textBlocks[id]);
            delete textBlocks[id];
        }, timeout);
    }
}

/**
 * Removes all TextBlocks from the 3D view's overlay
 */
const clearAllTextBlocks = function () {
    for (const id in textBlocks) {
        if (Object.hasOwnProperty.call(textBlocks, id)) {
            const element = textBlocks[id];

            if (element.timeout) {
                clearTimeout(element.timeout);
            }

            textStackPanel.removeControl(element);
            delete textBlocks[id];
        }
    }
};

// Load Babylon
var babylonScripts = ['https://preview.babylonjs.com/babylon.js', 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js', 'https://preview.babylonjs.com/gui/babylon.gui.min.js'];
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
    if(window.externalVariables.roboscapeSimCanvasInstance.width() > world.width()){
        window.externalVariables.roboscapeSimCanvasInstance.setWidth(world.width());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if(window.externalVariables.roboscapeSimCanvasInstance.height() > world.height()){
        window.externalVariables.roboscapeSimCanvasInstance.setHeight(world.height());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if(window.externalVariables.roboscapeSimCanvasInstance.left() < 0){
        window.externalVariables.roboscapeSimCanvasInstance.setLeft(0);
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if(window.externalVariables.roboscapeSimCanvasInstance.right() > world.width()){
        window.externalVariables.roboscapeSimCanvasInstance.setRight(world.width());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if(window.externalVariables.roboscapeSimCanvasInstance.bottom() > world.height()){
        window.externalVariables.roboscapeSimCanvasInstance.setBottom(world.height());
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
    if(window.externalVariables.roboscapeSimCanvasInstance.top() < 0){
        window.externalVariables.roboscapeSimCanvasInstance.setTop(0);
        window.externalVariables.roboscapeSimCanvasInstance.fixCanvasLayout();
    }
});