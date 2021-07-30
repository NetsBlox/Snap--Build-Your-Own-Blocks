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
    scene.enablePhysics(new BABYLON.Vector3(0,-10,0), new BABYLON.AmmoJSPlugin());

    // Parameters : name, position, scene
    camera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(0, 1.25, 2.5), scene);
    camera.speed = 0.4;
    camera.minZ = 0.01;

    // Targets the camera to a particular position. In this case the scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // Attach the camera to the canvas
    camera.attachControl(canvas, true);
    
    light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    
    // Make ground
    var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, scene);

    addRobot();

    engine.runRenderLoop(function () {
        if (stage.boundingBox().width() != canvas.width || stage.boundingBox().height() != canvas.height ) {
            resizeBabylonCanvas();
        }

        // Limit camera
        if (camera.position._y < 0.1) {
            camera.position._y = 0.1;
            camera.position._isDirty = true;
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

const addRobot = async function () {
    let imported = await BABYLON.SceneLoader.ImportMeshAsync('', './src/', 'parallax_robot.gltf');
    let mesh = imported.meshes[1];

    var collidersVisible = true;
    var boxCollider = BABYLON.Mesh.CreateBox('box1', 0.3, scene);
    boxCollider.position.y = mesh.position._y;
    boxCollider.isVisible = collidersVisible;
    
    // Create a physics root and add all children
    mesh.addChild(boxCollider);
    mesh.position.y += 1;

    // Enable physics on colliders first then physics root of the mesh
    boxCollider.physicsImpostor = new BABYLON.PhysicsImpostor(boxCollider, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.NoImpostor, {  
        mass: 5,
        friction: 0.5,
        restitution: 0.5,
        nativeOptions: {
            noSleep: true,
            move: true
        }
    }, scene);

    return mesh;
};