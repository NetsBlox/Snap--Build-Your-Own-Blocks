var canvas;
var engine;
var stage;
var scene;
var camera;

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
        if (bodies) {
            // Show robots
            for (let label of Object.keys(bodies)) {
                // create if new
                if (!Object.keys(bodyMeshes).includes(label)) {
                    if (bodiesInfo[label].image == 'parallax_robot') {
                        bodyMeshes[label] = addRobot().then(result => {
                            result.setPivotMatrix(BABYLON.Matrix.Translation(0, 1, 0), false);
                            result.position.y = 0.15;
                            bodyMeshes[label] = result;
                        });
                    } else {
                        bodyMeshes[label] = addBlock(bodiesInfo[label].width / 100, bodiesInfo[label].height / 100).then(result => {
                            result.setPivotMatrix(BABYLON.Matrix.Translation(0, 1, 0), false);
                            result.position.y = 1;
                            bodyMeshes[label] = result;
                        });
                    }
                } else {
                    // Detect not yet loaded mesh
                    if (typeof bodyMeshes[label].then === 'function'){
                        continue;
                    }

                    // Update position
                    let body = bodies[label];
                    let { x, y } = body.pos;
                    
                    let angle = body.angle;
                    // Extrapolate/Interpolate position and rotation
                    x += ((nextBodies[label].pos.x - x) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    y += ((nextBodies[label].pos.y - y) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    angle += ((nextBodies[label].angle - angle) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
    
                    bodyMeshes[label].position.x = x / 100;
                    bodyMeshes[label].position.z = -y / 100;
                    bodyMeshes[label].rotationQuaternion = null;
                    
                    if (bodiesInfo[label].image == 'parallax_robot') {
                        bodyMeshes[label].rotation.y = angle + Math.PI;
                    } else {
                        bodyMeshes[label].rotation.y = angle;
                    }
                    
                }
            }
        }

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

const addRobot = async function () {
    let imported = await BABYLON.SceneLoader.ImportMeshAsync('', './src/', 'parallax_robot.gltf');

    // let physicsRoot = makePhysicsObject(imported.meshes, scene, 1);
    // physicsRoot.position.y += 1.5;

    // let mesh = imported.meshes[1];

    // var collidersVisible = true;
    // var boxCollider = BABYLON.Mesh.CreateBox('box1', 0.3, scene);
    // boxCollider.position.y = mesh.position._y;
    // boxCollider.isVisible = collidersVisible;
    
    // // Create a physics root and add all children
    // mesh.addChild(boxCollider);
    // mesh.position.y += 1;

    // // Enable physics on colliders first then physics root of the mesh
    // boxCollider.physicsImpostor = new BABYLON.PhysicsImpostor(boxCollider, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, scene);
    // mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.NoImpostor, {  
    //     mass: 5,
    //     friction: 0.5,
    //     restitution: 0.5,
    //     nativeOptions: {
    //         noSleep: true,
    //         move: true
    //     }
    // }, scene);
    //
    //return mesh;

    imported.meshes[0].scaling.scaleInPlace(2);
    return imported.meshes[0];
};

var geckosSocket;
var bodies = {};
var nextBodies = {};
var lastUpdateTime;
var nextUpdateTime;
var roomInfo;
var roomID;

var bodyMeshes = {};

const geckosTest = function(){
    geckosSocket = geckos();
    geckosSocket.onConnect(e => {
        joinRoom('create');

        // Handle incremental updates
        geckosSocket.on('update', data => {
            bodies = { ...nextBodies };
            nextBodies = { ...bodies, ...data };
            lastUpdateTime = nextUpdateTime;
            nextUpdateTime = Date.now();
        });

        // Handle full updates
        geckosSocket.on('fullUpdate', data => {
            bodiesInfo = data;
            bodies = data;
            nextBodies = data;
            lastUpdateTime = Date.now();
            nextUpdateTime = Date.now();
        });

        // Handle room info
        geckosSocket.on('roomInfo', info => {
            roomInfo = info;

            if (info.background != '') {
                roomBG.src = `/img/backgrounds/${info.background}.png`;
            }
        });

        geckosSocket.on('error', error => {
            console.log(error);
        });

        // If we were previously connected, let server know we had an issue
        geckosSocket.on('reconnect', attempt => {
            console.log(`Reconnected after ${attempt} attempts!`);
            geckosSocket.emit('postReconnect', roomID);
        });

        // Room joined message
        geckosSocket.on('roomJoined', result => {
            if (result !== false) {
                console.log(`Joined room ${result}`);
                roomID = result;

                // Start running

            } else {
                // Failed to join room
                console.log('Failed to join room');
            }
        });
    });
};

/**
 * Send message to join room
 * @param {string} room
 * @param {string} env
 */
function joinRoom(room, env = '') {
    // Prevent joining a second room
    if (roomID != null) {
        throw 'Already in room.';
    }

    geckosSocket.emit('joinRoom', { roomID: room, env });
}

window.addEventListener('load', () => {
    setTimeout(activateBabylon, 200);
});