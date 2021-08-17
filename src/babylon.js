var canvas;
var engine;
var stage;
var scene;
var camera;
var ui;
var vrHelper;

var updateLoopFunctions = [];

CanvasMorph.prototype = new DialogBoxMorph();
CanvasMorph.uber = DialogBoxMorph.prototype;
CanvasMorph.id = 0;

function CanvasMorph(title = 'Canvas') {
    this.init(title);
}

CanvasMorph.prototype.init = function(title) {
    var myself = this;

    this.minWidth = 600;
    this.minHeight = 300;
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'relative';
    canvas = this.canvas;

    this.loaded = false;

    this.background = new Morph();
    this.background.setColor(new Color(200, 200, 200));

    CanvasMorph.uber.init.call(this);
    this.add(this.background);
    this.key = 'canvas' + CanvasMorph.id++;

    this.labelString = title;
    this.createLabel();
    this.addButton('hide', 'Close');
    this.rerender();
    this.fixLayout();
    this.rerender();
};

CanvasMorph.prototype.fixLayout = function() {
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

CanvasMorph.prototype.fixCanvasLayout = function() {
    var width = this.width() - 2 * this.padding,
        bh = this.buttons ? this.buttons.height() : 0,
        lh = this.label ? this.label.height() : 0,
        height = this.height() - 4 * this.padding - bh - lh;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.background.setExtent(new Point(width, height));
    this.setCanvasPosition();
};

CanvasMorph.prototype.showCanvas = function () {
    this.setCanvasPosition();
    this.canvas.style.display = 'inline';
    
    if (vrHelper) {
        vrHelper.vrButton.style.display = 'inline';
    }  
};

CanvasMorph.prototype.hideCanvas = function () {
    this.canvas.style.display = 'none';
    
    if (vrHelper) {
        vrHelper.vrButton.style.display = 'none';
    }  
};

CanvasMorph.prototype.show = function() {
    CanvasMorph.uber.show.call(this);
    this.showCanvas();
};

CanvasMorph.prototype.hide = function() {
    CanvasMorph.uber.hide.call(this);
    this.hideCanvas();
};

CanvasMorph.prototype.prepareToBeGrabbed = function() {
    this.hideCanvas();
};

CanvasMorph.prototype.justDropped = function() {
    this.showCanvas();
};

CanvasMorph.prototype.setCanvasPosition = function() {
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

CanvasMorph.prototype.popUp = function(world) {
    document.body.appendChild(this.canvas);
    CanvasMorph.uber.popUp.call(this, world);
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

CanvasMorph.prototype.destroy = function() {
    this.canvas.remove();
    CanvasMorph.uber.destroy.call(this);
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
    
    //canvas = document.getElementById('3dcanvas');
    engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    stage = world.children[0].children.find(c => c.name == 'Stage');

    scene = new BABYLON.Scene(engine);
    
    //enable Physics in the scene
    await Ammo();

    // Parameters : name, position, scene
    camera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(4, 10, -4), scene);
    camera.speed = 0.4;
    camera.minZ = 0.01;

    // Targets the camera to a particular position. In this case the scene origin
    //camera.setTarget(BABYLON.Vector3.Zero());
    
    // Attach the camera to the canvas
    camera.attachControl(canvas, true);
    
    light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    
    // Make ground
    let groundSize = 8;
    var ground = BABYLON.Mesh.CreateGround('ground_floor', groundSize, groundSize, 2, scene);
    ground.position.x = groundSize / 2;
    ground.position.z = -groundSize / 2;
    ground.position.y = 2;
    
    camera.setTarget(ground.position);
    
    scene.enablePhysics(null, new BABYLON.AmmoJSPlugin());
    // // scene.getPhysicsEngine().setTimeStep(.05);
    // scene.enablePhysics(null, new BABYLON.OimoJSPlugin());
    // // scene.getPhysicsEngine().setMaxSteps(10);
    // //scene.getPhysicsEngine().setTimeStep(.05);
    // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.9 }, scene);
    
    engine.runRenderLoop(function () {

        let frameTime = Date.now();
        
        for (let func of updateLoopFunctions) {
            func(frameTime);
        }

        // stage = world.children[0].children.find(c => c.name == 'Stage');
        // if (stage.boundingBox().width() != canvas.width || stage.boundingBox().height() != canvas.height ) {
        //     resizeBabylonCanvas();
        // }

        // Limit camera
        const cameraMinY = 0.1;
        if (camera.position.y < cameraMinY) {
            camera.position.y = cameraMinY;
        }

        // canvas.style.left = stage.boundingBox().left() + 'px';
        // canvas.style.top = stage.boundingBox().top() + 'px';

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
    }, 1000);
};

const makePhysicsObject = (newMeshes, scene, scaling)=>{
    // Create physics root and position it to be the center of mass for the imported mesh
    var physicsRoot = new BABYLON.Mesh('physicsRoot', scene);
    physicsRoot.position.y -= 0.9;

    // For all children labeled box (representing colliders), make them invisible and add them as a child of the root object
    newMeshes.forEach((m, i)=>{
        if(m.name.indexOf('box') != -1){
            m.isVisible = false;
            physicsRoot.addChild(m);
        }
    });

    // Add all root nodes within the loaded gltf to the physics root
    newMeshes.forEach((m, i)=>{
        if(m.parent == null){
            physicsRoot.addChild(m);
        }
    });

    // Make every collider into a physics impostor
    physicsRoot.getChildMeshes().forEach((m)=>{
        if(m.name.indexOf('box') != -1){
            m.scaling.x = Math.abs(m.scaling.x);
            m.scaling.y = Math.abs(m.scaling.y);
            m.scaling.z = Math.abs(m.scaling.z);
            m.physicsImpostor = new BABYLON.PhysicsImpostor(m, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0.1 }, scene);
        }
    });
    
    // Scale the root object and turn it into a physics impsotor
    physicsRoot.scaling.scaleInPlace(scaling);
    physicsRoot.physicsImpostor = new BABYLON.PhysicsImpostor(physicsRoot, BABYLON.PhysicsImpostor.NoImpostor, { mass: 3 }, scene);
    
    return physicsRoot;
};

const addBlock = async function (width, height) {
    return await BABYLON.MeshBuilder.CreateBox('box', {width, depth: height, height: 1}, scene);
};

// Load Babylon
var babylonScripts = ['https://preview.babylonjs.com/babylon.js','https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js','https://preview.babylonjs.com/ammo.js','https://preview.babylonjs.com/cannon.js','https://preview.babylonjs.com/Oimo.js', 'https://preview.babylonjs.com/gui/babylon.gui.min.js'];
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
        if (!window.externalVariables.canvasInstance) {
            (window.externalVariables.canvasInstance = new CanvasMorph()).popUp(world);
            window.externalVariables.canvasInstance.hide();
        }
    }, 200);
});