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

var updateLoopFunctions = [];

var textStackPanel;
const textBlocks = {};

var assetsDir;
var apiServer;

if (window.origin.includes('localhost')) {
    assetsDir = 'http://localhost:8080/src/';
    apiServer = 'http://localhost:5000/';
} else {
    assetsDir = 'https://extensions.netsblox.org/extensions/RoboScapeOnline/assets/';
    apiServer = 'https://roboscapeonlineapi.netsblox.org/';
}

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
    engine.useReverseDepthBuffer = true;

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
var babylonScripts = ['https://cdn.jsdelivr.net/npm/babylonjs@5.9.1/babylon.min.js', 'https://cdn.jsdelivr.net/npm/babylonjs-loaders@5.9.1/babylonjs.loaders.min.js', 'https://cdn.jsdelivr.net/npm/babylonjs-gui@5.9.1/babylon.gui.min.js'];
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