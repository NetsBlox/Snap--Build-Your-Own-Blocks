
var socket;
var bodies = {};
var nextBodies = {};
var lastUpdateTime;
var nextUpdateTime;
var roomInfo;
var roomID;
var bodyMeshes = {};
var availableEnvironments = [];

const connectToRoboScapeSim = function () {
    if (socket && socket.connected) {
        return;
    }

    socket = io("//localhost:9001", { secure: true });
    //socket = io("//3-222-232-255.nip.io", { secure: true });
    socket.on('connect', e => {
        

        // Handle incremental updates
        socket.on('update', data => {
            if (performance.now() - nextUpdateTime > 10) {
                bodies = { ...nextBodies };
                nextBodies = { ...bodies, ...data };
                lastUpdateTime = nextUpdateTime;
                nextUpdateTime = performance.now();
            }
        });

        // Handle full updates
        socket.on('fullUpdate', data => {
            bodiesInfo = { ...data };
            bodies = {...data, ...bodies};
            nextBodies = { ...data };
            lastUpdateTime = lastUpdateTime || performance.now() - 50;
            nextUpdateTime = performance.now();

            // Create entries in dropdown
            window.externalVariables.roboscapeSimCanvasInstance.robotsList.choices =
                Object.values(bodiesInfo).filter(info => info.image == 'parallax_robot')
                    .reduce((prev, info) => {
                        prev[info.label.replace('robot_', '')] = info.label.replace('robot_', '');
                        return prev;
                    }, {});
        });

        // Handle room info
        socket.on('roomInfo', info => {
            roomInfo = info;

            if (info.background != '') {
                roomBG.src = `/img/backgrounds/${info.background}.png`;
            }
        });

        socket.on('error', error => {
            console.error(error);
        });

        // If we were previously connected, let server know we had an issue
        socket.on('reconnect', attempt => {
            console.log(`Reconnected after ${attempt} attempts!`);
            socket.emit('postReconnect', roomID);
        });

        // Room joined message
        socket.on('roomJoined', result => {
            if (result !== false) {
                world.inform(`Joined room ${result}`);
                roomID = result;

                // Start running
                updateCanvasTitle(result);

            } else {
                // Failed to join room
                world.inform('Failed to join room');
            }
        });

        // Update list of available environments
        socket.on('availableEnvironments', list => {
            availableEnvironments = list;
        });

        // Robot beeped
        socket.on('beep', args => {
            beepData = args[0];
            console.log(`beep ${beepData.Robot} ${beepData.Frequency} hz, ${beepData.Duration} ms `);
            playNote(beepData.Robot, beepData.Frequency, beepData.Duration);
        });

        // Kicked from room
        socket.on('roomLeft', args => {
            leaveRoom();
        });
    });

    // Lost connection
    socket.on('disconnect', () => {
        leaveRoom();
    });
};


function updateCanvasTitle(result) {
    window.externalVariables.roboscapeSimCanvasInstance.labelString = result;
    window.externalVariables.roboscapeSimCanvasInstance.createLabel();
    window.externalVariables.roboscapeSimCanvasInstance.rerender();
    window.externalVariables.roboscapeSimCanvasInstance.fixLayout();
    window.externalVariables.roboscapeSimCanvasInstance.rerender();
    window.externalVariables.roboscapeSimCanvasInstance.handle.fixLayout();
    window.externalVariables.roboscapeSimCanvasInstance.handle.rerender();
}

function newRoom(environment = 'default', password = '') {
    joinRoom('create', environment, password);
}

/**
 * Send message to join a room
 * @param {string} room
 * @param {string} env
 */
 function joinRoom(room, env = '', password = '') {
    // Prevent joining a second room
    if (roomID != null) {
        leaveRoom();
    }

    socket.emit('joinRoom', { roomID: room, env, password, namespace: SnapCloud.username || SnapCloud.clientId });
 }

 /**
  * Leave current room and clean up contents
  */
function leaveRoom() {
    if (roomID == null) {
        console.warn("Not in a room to leave");
    }
    
    // Not actually required, as server enforces one-room policy
    socket.emit('leaveRoom');

    // Reset data
    bodies = {};
    nextBodies = {};
    roomInfo = null;
    roomID = null;

    // Clean up meshes
    for (let mesh of Object.values(bodyMeshes)) {
        mesh.dispose();
    }
    bodyMeshes = {};
    updateCanvasTitle("Not connected");
}

/**
 * Import robot mesh and add it to scene
 * @returns Robot mesh object
 */
const addRobot = async function () {
    let imported = await BABYLON.SceneLoader.ImportMeshAsync('', 'http://localhost:8080/src/', 'parallax_robot.gltf');
    //let imported = await BABYLON.SceneLoader.ImportMeshAsync('', 'https://netsblox.org/', 'parallax_robot.gltf');
    imported.meshes[0].scaling.scaleInPlace(2);
    return imported.meshes[0];
};

// Create update function for robots

// Load geckos
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.socket.io/socket.io-2.3.1.slim.js';
document.body.appendChild(script);

var interpolate = function (x1, x2, dx1, dx2, t1, t2, t) {
    t = (t - t2) / Math.max(16, t2 - t1);
    return BABYLON.Scalar.Lerp(x1, x2, t);
}

var interpolateRotation = function (q1, q2, dq1, dq2, t1, t2, t) {
    t = (t - t2) / Math.max(32, t2 - t1);
    return BABYLON.Quaternion.Slerp(q1, q2, t);
}

setTimeout(() => {
    updateLoopFunctions.push((frameTime) => {
        if (bodies) {
            // Show robots
            for (let label of Object.keys(bodies)) {
                // create if new
                if (!Object.keys(bodyMeshes).includes(label)) {
                    if(Object.keys(bodiesInfo).includes(label)){
                        if (bodiesInfo[label].image == 'parallax_robot') {
                            bodyMeshes[label] = addRobot().then(result => {
                                //result.setPivotMatrix(BABYLON.Matrix.Translation(0, 1, 0), false);
                                //result.position.y = 0.15;
                                bodyMeshes[label] = result;
                            });
                        } else {
                            bodyMeshes[label] = addBlock(bodiesInfo[label].width, bodiesInfo[label].height, bodiesInfo[label].depth).then(result => {
                                //result.setPivotMatrix(BABYLON.Matrix.Translation(0, 1, 0), false);
                                //result.position.y = 1;

                                
                                if(label == "ground"){
                                    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial");
                                    groundMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.35);
                                    result.material = groundMaterial;    
                                }

                                bodyMeshes[label] = result;
                            });
                        }
                    }
                } else {
                    // Detect not yet loaded mesh
                    if (typeof bodyMeshes[label].then === 'function') {
                        continue;
                    }

                    // Update position
                    let body = bodies[label];
                    let { x, y, z } = body.pos;
                    
                    let angle = {...body.angle};
                    const nextBody = nextBodies[label];
                    // Extrapolate/Interpolate position and rotation
                    // x += ((nextBodies[label].pos.x - x) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    // y += ((nextBodies[label].pos.y - y) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    // z += ((nextBodies[label].pos.z - z) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);

                    x = interpolate(x, nextBody.pos.x, body.vel.x || 0, nextBody.vel.x || 0, lastUpdateTime, nextUpdateTime, frameTime);
                    y = interpolate(y, nextBody.pos.y, body.vel.y || 0, nextBody.vel.y || 0, lastUpdateTime, nextUpdateTime, frameTime);
                    z = interpolate(z, nextBody.pos.z, body.vel.z || 0, nextBody.vel.z || 0, lastUpdateTime, nextUpdateTime, frameTime);

                    
                    // angle.x += ((nextBodies[label].angle.x - angle.x) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    // angle.y += ((nextBodies[label].angle.y - angle.y) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    // angle.z += ((nextBodies[label].angle.z - angle.z) * (frameTime - lastUpdateTime)) / Math.max(1, nextUpdateTime - lastUpdateTime);
                    angle = new BABYLON.Quaternion(
                        angle.X, angle.Y, angle.Z, angle.W
                    );

                    let nextAngle = new BABYLON.Quaternion(
                        nextBody.angle.X, nextBody.angle.Y, nextBody.angle.Z, nextBody.angle.W
                    );

                    bodyMeshes[label].position.x = x;
                    bodyMeshes[label].position.y = y;
                    bodyMeshes[label].position.z = z;

                    bodyMeshes[label].rotationQuaternion = interpolateRotation(angle, nextAngle, null, null, lastUpdateTime, nextUpdateTime, frameTime);
                    // bodyMeshes[label].rotationQuaternion = new BABYLON.Quaternion(
                    //     angle.X, angle.Y, angle.Z, angle.W
                    // );
                }
            }
        }
    });

    updateLoopFunctions.push(() => {
        if (firstPersonCam && scene.activeCamera == firstPersonCam) {
            if (firstPersonCam.targetRobot && bodyMeshes['robot_' + firstPersonCam.targetRobot]) {
                let body = bodyMeshes['robot_' + firstPersonCam.targetRobot];
                let offset = new BABYLON.Vector3();

                BABYLON.Vector3.Forward().scale(0.11).rotateByQuaternionToRef(body.rotationQuaternion, offset);
                offset = offset.add(new BABYLON.Vector3(0, 0.05, 0));

                firstPersonCam.position = body.position.add(offset);
                firstPersonCam.rotationQuaternion = body.rotationQuaternion;
            }
        }
    });
}, 200);

// Mapping of robots to currently playing notes (so robots can only play one at a time)
let roboNotes = {};

const playNote = function(robot, frequency, duration){
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
}