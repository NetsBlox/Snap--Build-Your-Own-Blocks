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
var nameTags = {};
var availableEnvironments = [];
var availableRooms = [];
var material_count = 0;
var connectedServer = null;
var lastPassword = '';

const connectToRoboScapeSim = function (server) {
    return new Promise((resolve, reject) => {
        if (socket != undefined && socket.connected && connectedServer == server) {
            console.log("Existing socket");
            return resolve(socket);
        }

        console.log("Creating new socket");

        if (socket != undefined && socket.connected && connectedServer != server) {
            socket.disconnect();
        }

        // if (window.origin.includes('localhost')) {
        //     socket = io('//localhost:9001', { secure: true, withCredentials: false });
        // } else {
        //     socket = io('//3-222-232-255.nip.io', { secure: true, withCredentials: false });
        // }

        // if IP, rewrite as domain to make usable
        if (server.match(/(\d{1,3}\.){3}\d{1,3}/)) {
            server = server.replaceAll('.', '-');
            server += ".nip.io";
        }

        if (window.origin.includes('localhost')) {
            server += ":9001";
        }

        socket = io('//' + server, { secure: true, withCredentials: false });

        socket.on('connect', e => {
            connectedServer = server;
            // Handle incremental updates
            socket.on('u', data => {
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

                if (Object.keys(bodies).length == 0 || Object.keys(nextBodies).length == 0) {
                    bodies = { ...data };
                    nextBodies = { ...data };
                    lastUpdateTime = lastUpdateTime || performance.now() - 50;
                    nextUpdateTime = performance.now();
                    lastUpdateServerTime = data.time * 1000;
                    nextUpdateServerTime = data.time * 1000;
                    startClientTime = nextUpdateTime;
                    startServerTime = data.time * 1000;
                    serverTimeOffset = startClientTime - startServerTime;
                }


                // Create entries in dropdown
                updateRobotsList(Object.keys(bodiesInfo).filter(label => label.startsWith('robot')));
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

            var lastError = {};

            socket.on('error', error => {
                console.error(error);
                if (error.message != lastError.message) {
                    world.inform(error);
                    lastError = error;
                }
            });

            socket.on('connect_error', error => {
                console.error(error);
                if (error.message != lastError.message) {
                    world.inform(error);
                    lastError = error;
                }
            });

            socket.on('reconnect_error', error => {
                console.error(error);
            });

            // If we were previously connected, let server know we had an issue
            socket.on('reconnect', attempt => {
                console.log(`Reconnected after ${attempt} attempts!`);
                //socket.emit('postReconnect', roomID);
                joinRoom(roomID, lastPassword);
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

            // Show message
            socket.on('showText', args => {
                let text = args[0];
                let id = args[1];
                let timeout = args[2];

                addOrUpdateText(text, id, timeout);
            });

            socket.on('numeric', args => {
                let id = args[0];
                let num = args[1];

                addOrUpdateText(num, id, 2000);
            });

            // Robot claimed update
            socket.on('robotClaimed', args => {
                let robot = args[0];
                let user = args[1];
                let status = args[2];

                console.log(`Robot ${robot} ${status ? '' : 'un'}claimed by ${user}`);
                if (status) {
                    bodiesInfo['robot_' + robot].claimedBy = user;
                } else {
                    bodiesInfo['robot_' + robot].claimedBy = null;
                }

                updateRobotRowUI();
            });

            // LED status change
            socket.on('led', args => {
                //console.log(args);
            });

        });

        // Lost connection
        socket.on('disconnect', () => {
            updateCanvasTitle('Not connected');
        });

        setTimeout(() => {
            resolve(socket);
        }, 50);
    });
};

async function newRoom(environment = 'default', password = '') {
    const response = await fetch(apiServer + "rooms/create", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURI(getUsername())}&namespace=${encodeURI(getUsername())}&password=${encodeURI(password)}&environment=${encodeURI(environment)}`
    });
    const responseObject = await response.json();
    joinRoom(responseObject.room, password, responseObject.server);
}

/**
 * Send message to join a room
 * @param {string} room
 * @param {string} env
 */
async function joinRoom(room, password = '', server = '') {

    // Look up server
    if (server == '') {
        let response = await fetch(apiServer + "rooms/info?id=" + encodeURIComponent(room));
        server = (await response.json()).server;
    }

    if (!socket || !socket.connected || connectedServer != server) {
        await connectToRoboScapeSim(server);
    }

    // Prevent joining a second room
    if (roomID != null && room != roomID) {
        leaveRoom();
    }

    socket.emit('joinRoom', { roomID: room, password, username: SnapCloud.username || SnapCloud.clientId, namespace: SnapCloud.username || SnapCloud.clientId });
    lastPassword = password;
}

/**
  * Leave current room and clean up contents
  */
function leaveRoom() {
    if (roomID == null) {
        console.warn('Not in a room to leave');
    }

    // Reset data
    bodies = {};
    nextBodies = {};
    roomInfo = null;
    roomID = null;

    // Clean up meshes
    for (let mesh of Object.values(bodyMeshes)) {
        if (mesh?.dispose) {
            mesh?.dispose();
        }
    }
    bodyMeshes = {};

    updateCanvasTitle('Not connected');

    // Reset camera
    scene.activeCamera = camera;
    camera.position = new BABYLON.Vector3(4, 10, -4);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    clearAllTextBlocks();
}

// Load socket.io
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdn.socket.io/4.4.1/socket.io.min.js';
document.body.appendChild(script);

var interpolate = function (x1, x2, dx1, dx2, t1, t2, t) {
    if (Math.abs(x1 - x2) < 0.005) {
        return (t < t2) ? +x1 : +x2;
    }

    t = (t - t2) / Math.max(4, t2 - t1);
    return BABYLON.Scalar.Lerp(+x1, +x2, t);
};

var interpolateRotation = function (q1, q2, dq1, dq2, t1, t2, t) {
    if (q1.equalsWithEpsilon(q2, 0.01)) {
        return q1.normalize();
    }

    t = (t - t2) / Math.max(10, t2 - t1);
    return BABYLON.Quaternion.Slerp(q1, q2, t).normalize();
};

/**
 * Converts a color hex string to an RGB color object
 * @param {String} hexstring Input hex string (e.g. '#FFFFFF'), beginning # is optional
 * @returns {{r: Number, g: Number, b: Number}} 
 */
var hex2rgb = function (hexstring) {
    if (hexstring[0] != '#') {
        hexstring = '#' + hexstring;
    }

    if (hexstring.length == 4) {
        r = parseInt(hexstring.charAt(1) + '' + hexstring.charAt(1), 16) / 255;
        g = parseInt(hexstring.charAt(2) + '' + hexstring.charAt(2), 16) / 255;
        b = parseInt(hexstring.charAt(3) + '' + hexstring.charAt(3), 16) / 255;
    }
    else {
        r = parseInt(hexstring.charAt(1) + '' + hexstring.charAt(2), 16) / 255;
        g = parseInt(hexstring.charAt(3) + '' + hexstring.charAt(4), 16) / 255;
        b = parseInt(hexstring.charAt(5) + '' + hexstring.charAt(6), 16) / 255;
    }

    return { r, g, b };
};

setTimeout(() => {
    updateLoopFunctions.push((frameTime) => {

        let tempNextTime = lastUpdateTime + (nextUpdateServerTime - lastUpdateServerTime);

        if (bodies) {
            // Show robots
            for (let label of Object.keys(bodies)) {
                // create if new
                if (!Object.keys(bodyMeshes).includes(label)) {
                    if (Object.keys(bodiesInfo).includes(label)) {

                        if (!bodiesInfo[label].width || !bodiesInfo[label].visualInfo || bodiesInfo[label].visualInfo.modelScale == -1) {
                            continue;
                        }

                        if (bodiesInfo[label].visualInfo.model && (bodiesInfo[label].visualInfo.model.endsWith('.gltf') || bodiesInfo[label].visualInfo.model.endsWith('.glb'))) { // Mesh object
                            bodyMeshes[label] = addMesh(bodiesInfo[label].visualInfo.model).then(result => {
                                bodyMeshes[label] = result;

                                if (label.startsWith('robot_')) {
                                    let tag = createLabel(label.substring(label.length - 4));

                                    // Move to position
                                    tag.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_ALL;
                                    tag.setParent(result);
                                    tag.scaling.x = -0.05;
                                    tag.scaling.y = 0.05;
                                    tag.position.y = -0.2;

                                    nameTags[label] = tag;
                                } else {
                                    if (bodiesInfo[label].visualInfo.modelScale) {
                                        bodyMeshes[label].scaling.x = bodiesInfo[label].visualInfo.modelScale;
                                        bodyMeshes[label].scaling.y = bodiesInfo[label].visualInfo.modelScale;
                                        bodyMeshes[label].scaling.z = bodiesInfo[label].visualInfo.modelScale;
                                    }
                                }
                            });
                        } else {
                            bodyMeshes[label] = addBlock(bodiesInfo[label].width, bodiesInfo[label].height, bodiesInfo[label].depth).then(result => {
                                if (bodiesInfo[label].visualInfo.color && !bodiesInfo[label].visualInfo.image && bodiesInfo[label].visualInfo.color[0] == '#') {
                                    var material = new BABYLON.StandardMaterial('material' + material_count++);

                                    let color = hex2rgb(bodiesInfo[label].visualInfo.color);

                                    material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                                    material.specularColor.r = 0.5;
                                    material.specularColor.g = 0.5;
                                    material.specularColor.b = 0.5;

                                    result.material = material;

                                } else if (bodiesInfo[label].visualInfo.image && bodiesInfo[label].visualInfo.image.endsWith('.png')) {
                                    var material = new BABYLON.StandardMaterial('material' + material_count++);
                                    material.diffuseTexture = new BABYLON.Texture(assetsDir + bodiesInfo[label].visualInfo.image);
                                    material.diffuseTexture.uScale = bodiesInfo[label].visualInfo.uScale ?? bodiesInfo[label].width;
                                    material.diffuseTexture.vScale = bodiesInfo[label].visualInfo.vScale ?? bodiesInfo[label].height;

                                    material.specularColor.r = 0.5;
                                    material.specularColor.g = 0.5;
                                    material.specularColor.b = 0.5;

                                    if (bodiesInfo[label].visualInfo.color) {
                                        let color = hex2rgb(bodiesInfo[label].visualInfo.color);
                                        material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                                    }

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

                    let angle = { ...body.angle };
                    const nextBody = nextBodies[label];

                    if (!nextBody) {
                        continue;
                    }

                    // Extrapolate/Interpolate position and rotation
                    if (body.vel == undefined) {
                        body.vel = {};
                    }

                    if (nextBody.vel == undefined) {
                        nextBody.vel = {};
                    }

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

                BABYLON.Vector3.Forward().scale(0.6).rotateByQuaternionToRef(body.rotationQuaternion, offset);
                offset = offset.add(new BABYLON.Vector3(0, 0.05, 0));

                firstPersonCam.position = body.position.add(offset);
                firstPersonCam.rotationQuaternion = body.rotationQuaternion;
            }
        }
    });
}, 200);

// Mapping of robots to currently playing notes (so robots can only play one at a time)
let roboNotes = {};

const updateRoomsList = async function () {
    let response = await fetch(apiServer + "rooms/list?user=" + (SnapCloud.username || SnapCloud.clientId));
    availableRooms = await response.json();
    availableRooms = availableRooms.sort((room1, room2) => Date.parse(room2.lastInteractionTime) - Date.parse(room1.lastInteractionTime));
}

const updateEnvironmentsList = async function () {
    let response = await fetch(apiServer + "environments/list");
    availableEnvironments = await response.json();
}