
var socket;
var bodies = {};
var nextBodies = {};
var lastUpdateTime;
var nextUpdateTime;
var startServerTime = 0;
var startClientTime = 0;
var serverTimeOffset = 0;
var lastUpdateServerTime = 0;
var nextUpdateServerTime = 0;
var roomInfo;
var roomID;
var bodyMeshes = {};
var availableEnvironments = [];
var availableRooms = [];
var material_count = 0;

const connectToRoboScapeSim = function () {
    return new Promise((resolve, reject) => {
        if (socket && socket.connected) {
            resolve(socket);
        }

        if (window.origin.includes("localhost")) {
            socket = io("//localhost:9001", { secure: true });
        } else {
            socket = io("//3-222-232-255.nip.io", { secure: true });
        }

        socket.on('connect', e => {
            
            // Tell server who we are
            socket.emit('getRooms', SnapCloud.username || SnapCloud.clientId);

            // Handle incremental updates
            socket.on('update', data => {
                if (performance.now() - nextUpdateTime > 10) {
                    bodies = { ...nextBodies };
                    nextBodies = { ...bodies, ...data };
                    lastUpdateTime = nextUpdateTime;
                    nextUpdateTime = performance.now();
                    lastUpdateServerTime = nextUpdateServerTime;
                    nextUpdateServerTime = data.time * 1000;
                }
            });

            // Handle full updates
            socket.on('fullUpdate', data => {
                bodiesInfo = { ...data };
                bodies = { ...data, ...bodies };
                nextBodies = { ...data };
                lastUpdateTime = lastUpdateTime || performance.now() - 50;
                nextUpdateTime = performance.now();
                lastUpdateServerTime = data.time * 1000;
                nextUpdateServerTime = data.time * 1000;
                startClientTime = nextUpdateTime;
                startServerTime = data.time * 1000;
                serverTimeOffset = startClientTime - startServerTime;

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

                startServerTime = info.time * 1000;
                startClientTime = performance.now();
                serverTimeOffset = startClientTime - startServerTime;
            });

            socket.on('error', error => {
                console.error(error);
                world.inform(error);
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
                
                setTimeout(() => {
                    resolve(socket);
                }, 50);
            });

            // Update list of quick-join rooms
            socket.on('availableRooms', info => {
                ({ availableRooms } = info);
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

        setTimeout(reject, 3500);
    });
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

var modelsDir;

if (window.origin.includes("localhost")) {
    modelsDir = 'http://localhost:8080/src/';
} else {
    modelsDir = 'https://extensions.netsblox.org/RoboScapeOnline/assets/';
}

/**
 * Import robot mesh and add it to scene
 * @returns Robot mesh object
 */
const addRobot = async function () {
    imported = await BABYLON.SceneLoader.ImportMeshAsync('', modelsDir, 'parallax_robot.gltf');
    //imported.meshes[0].scaling.scaleInPlace(2);
    return imported.meshes[0];
};

// Load socket.io
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.socket.io/socket.io-2.3.1.slim.js';
document.body.appendChild(script);

var interpolate = function (x1, x2, dx1, dx2, t1, t2, t) {
    t = (t - t2) / Math.max(2, t2 - t1);
    return BABYLON.Scalar.Lerp(x1, x2, t);
}

var interpolateRotation = function (q1, q2, dq1, dq2, t1, t2, t) {
    t = (t - t2) / Math.max(2, t2 - t1);
    return BABYLON.Quaternion.Slerp(q1, q2, t);
}

// Converts a color hex string to an RGB color object 
var hex2rgb = function (hexstring) {
    if (hexstring[0] != '#') {
        hexstring = '#' + hexstring;
    }

    if(hexstring.length == 4){
        r = parseInt(hexstring.charAt(1) + "" + hexstring.charAt(1), 16) / 255;
        g = parseInt(hexstring.charAt(2) + "" + hexstring.charAt(2), 16) / 255;
        b = parseInt(hexstring.charAt(3) + "" + hexstring.charAt(3), 16) / 255;
    }
    else{
        r  = parseInt(hexstring.charAt(1) + "" + hexstring.charAt(2), 16) / 255;
        g  = parseInt(hexstring.charAt(3) + "" + hexstring.charAt(4), 16) / 255;
        b  = parseInt(hexstring.charAt(5) + "" + hexstring.charAt(6), 16) / 255;
    }

    return { r, g, b };
}

setTimeout(() => {
    updateLoopFunctions.push((frameTime) => {
        
        let tempNextTime = lastUpdateTime + (nextUpdateServerTime - lastUpdateServerTime);

        if (bodies) {
            // Show robots
            for (let label of Object.keys(bodies)) {
                // create if new
                if (!Object.keys(bodyMeshes).includes(label)) {
                    if (Object.keys(bodiesInfo).includes(label)) {
                        
                        if (!bodiesInfo[label].width) {
                            continue;
                        }

                        if (bodiesInfo[label].image == 'parallax_robot') {
                            bodyMeshes[label] = addRobot().then(result => {
                                bodyMeshes[label] = result;
                            });
                        } else {
                            bodyMeshes[label] = addBlock(bodiesInfo[label].width, bodiesInfo[label].height, bodiesInfo[label].depth).then(result => {
                                if(bodiesInfo[label].image && bodiesInfo[label].image[0] == "#"){
                                    var material = new BABYLON.StandardMaterial("material" + material_count++);

                                    let color = hex2rgb(bodiesInfo[label].image);

                                    material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                                    result.material = material;    
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
                    
                    if (!body.pos) {
                        continue;
                    }

                    let { x, y, z } = body.pos;
                    
                    let angle = {...body.angle};
                    const nextBody = nextBodies[label];
                    // Extrapolate/Interpolate position and rotation
                    x = interpolate(x, nextBody.pos.x, body.vel.x || 0, nextBody.vel.x || 0, lastUpdateTime, tempNextTime, frameTime);
                    y = interpolate(y, nextBody.pos.y, body.vel.y || 0, nextBody.vel.y || 0, lastUpdateTime, tempNextTime, frameTime);
                    z = interpolate(z, nextBody.pos.z, body.vel.z || 0, nextBody.vel.z || 0, lastUpdateTime, tempNextTime, frameTime);

                    angle = new BABYLON.Quaternion(
                        angle.X, angle.Y, angle.Z, angle.W
                    );

                    let nextAngle = new BABYLON.Quaternion(
                        nextBody.angle.X, nextBody.angle.Y, nextBody.angle.Z, nextBody.angle.W
                    );

                    bodyMeshes[label].position.x = x;
                    bodyMeshes[label].position.y = y;
                    bodyMeshes[label].position.z = z;

                    bodyMeshes[label].rotationQuaternion = interpolateRotation(angle, nextAngle, null, null, lastUpdateTime, tempNextTime, frameTime);
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