function loadWasmModule(name, symbols) {
    console.log(`loading wasm module: ${name}`);
    const s = document.createElement('script');
    s.type = "module";
    s.innerHTML = [
        `import init, {${symbols.join(',')}} from '/src/wasm/${name}/${name}.js';`,
        'await init();',
        `window.${name} = {};`,
        ...symbols.map(x => `window.${name}.${x} = ${x};`),
    ].join('\n');
    document.body.appendChild(s);
}

window.addEventListener('DOMContentLoaded', () => {
    loadWasmModule('amm_sdk_netsblox_wasm', ['translate_musicxml', 'translate_midi']);
});
