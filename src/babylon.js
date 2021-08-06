var canvas;
var engine;
var stage;
var scene;
var camera;

var updateLoopFunctions = [];

const resizeBabylonCanvas = function () {
    // Size 3d canvas to overlay stage
    canvas.style.width = stage.boundingBox().width() + 'px';
    canvas.style.height = stage.boundingBox().height() + 'px';
    canvas.style.left = stage.boundingBox().left() + 'px';
    canvas.style.top = stage.boundingBox().top() + 'px';
    engine.resize();
};

const activateBabylon = async function () {
    canvas = document.getElementById('3dcanvas');
    engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    stage = world.children[0].children.find(c => c.name == 'Stage');

    scene = new BABYLON.Scene(engine);
    
    //enable Physics in the scene
    //await Ammo();

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
    
    // // scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), new BABYLON.CannonJSPlugin());
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

        stage = world.children[0].children.find(c => c.name == 'Stage');
        if (stage.boundingBox().width() != canvas.width || stage.boundingBox().height() != canvas.height ) {
            resizeBabylonCanvas();
        }

        // Limit camera
        const cameraMinY = 0.1;
        if (camera.position.y < cameraMinY) {
            camera.position.y = cameraMinY;
        }

        canvas.style.left = stage.boundingBox().left() + 'px';
        canvas.style.top = stage.boundingBox().top() + 'px';

        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
    });

    setTimeout(() => {
        // Enable VR if available
        if ('getVRDisplays' in navigator || 'xr' in navigator){
            scene.createDefaultVRExperience({ createDeviceOrientationCamera: false, useXR: true });
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

window.addEventListener('load', () => {
    disableRetinaSupport(); // Need to find fix for this
    setTimeout(activateBabylon, 200);
});