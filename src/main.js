/* globals NetsBloxMorph, WorldMorph, */

var world;
var CLIENT_ID;

async function getConfiguration(serverUrl) {
    const opts = {
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
    };
    console.log('making request to', serverUrl);
    const config = await (await fetch(serverUrl + '/configuration', opts)).json();
    const DEFAULT_SERVICES_HOST = {url: serverUrl + '/services', categories: []};
    config.defaultServicesHost = DEFAULT_SERVICES_HOST;

    if (!config.servicesHosts.find(host => host.categories.length === 0)) {
        config.servicesHosts.push(DEFAULT_SERVICES_HOST);
    }
    console.log({config});
    return config;
}

async function startEnvironment(serverUrl) {
    const config = await getConfiguration(serverUrl);
    CLIENT_ID = config.clientId;

    world = new WorldMorph(document.getElementById('world'));
    world.worldCanvas.focus();
    new NetsBloxMorph(true, config).openIn(world);
    loop();
}

function loop() {
    requestAnimationFrame(loop);
    world.doOneCycle();
}
