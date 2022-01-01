/* globals SERVER_URL, NetsBloxMorph, WorldMorph, utils */

var world;
var CLIENT_ID;

function startEnvironment(config) {
    CLIENT_ID = config.clientId;

    world = new WorldMorph(document.getElementById('world'));
    world.worldCanvas.focus();
    new NetsBloxMorph(false, config).openIn(world);
    loop();
}

function loop() {
    requestAnimationFrame(loop);
    world.doOneCycle();
}
