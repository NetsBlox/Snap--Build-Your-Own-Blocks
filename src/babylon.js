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

const activateBabylon = function() {
    canvas = document.getElementById('3dcanvas');
    engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    stage = world.children[0].children.find(c => c.name == 'Stage');


    
    scene = new BABYLON.Scene(engine);
    
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
    const plane = BABYLON.MeshBuilder.CreatePlane('plane', {height:20, width: 20, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    plane.rotate(BABYLON.Vector3.Right(), Math.PI / 2);
    
    engine.runRenderLoop(function () {
        if (stage.boundingBox().width() != canvas.width || stage.boundingBox().height() != canvas.height ) {
            resizeBabylonCanvas();
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
    mesh.position = {...mesh.position, _isDirty: true, _y: 0.05};
    return mesh;
};