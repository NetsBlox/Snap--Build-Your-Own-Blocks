
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


window.addEventListener('load', () => {
    updateLoopFunctions.push((frameTime) => {
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
                    if (typeof bodyMeshes[label].then === 'function') {
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
    });
});