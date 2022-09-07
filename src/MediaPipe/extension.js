(function () {
    class HandsHandle {
        constructor() {
            this.resolve = null;
            this.expiry = 0;

            this.rawHandle = new Hands({
                locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });
            this.rawHandle.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            this.rawHandle.onResults(results => {
                const resolve = this.resolve;
                this.resolve = null;
                if (resolve !== null) resolve(results); // make sure resolve didn't expire
            });
        }
        async infer(image) {
            if (this.resolve !== null) throw Error('HandsHandle is currently in use');
            this.resolve = 'loading...'; // must immediately set resolve to non-null (gets real value async-ly later)
            this.expiry = +new Date() + 10000; // if not resolved by this time, invalidate

            return await new Promise(async resolve => {
                this.resolve = resolve;
                await this.rawHandle.send({ image });
            });
        }
        isIdle() {
            if (this.resolve === null) return true;
            if (+new Date() > this.expiry) {
                this.resolve = null;
                return true;
            }
            return false;
        }
    }

    const HANDS_HANDLES = [];
    function getHandsHandle() {
        for (const handle of HANDS_HANDLES) {
            if (handle.isIdle()) return handle;
        }
        const handle = new HandsHandle();
        HANDS_HANDLES.push(handle);
        return handle;
    }

    // Process.prototype._renderHands = async function (image) {
    //     const data = await this._findHands(image);
    //     const canvas = document.createElement('canvas');
    //     canvas.width = image.width;
    //     canvas.height = image.height;
    //     const context = canvas.getContext('2d');

    //     context.drawImage(image, 0, 0, canvas.width, canvas.height);
    //     for (const landmarks of data.multiHandLandmarks) {
    //         drawConnectors(context, landmarks, HAND_CONNECTIONS, { color: '#00ff00', lineWidth: 3 });
    //         drawLandmarks(context, landmarks, { color: '#ff0000', lineWidth: 1 });
    //     }

    //     return canvas;
    // }

    // Process.prototype.reportHandDetection = function (mode, img) {
    //     else if (mode === 'render') {
    //         const res = this.runAsyncFn(this._renderHands, { args: [img], timeout: 10000 });
    //         if (res !== undefined) {
    //             return new Costume(res);
    //         }
    //     }
    // };

    // ----------------------------------------------------------------------------

    const I32_MAX = 2147483647;

    function snapify(value) {
        if (Array.isArray(value)) return new List(value.map(x => snapify(x)));
        if (typeof(value) === 'object') {
            const res = [];
            for (const key in value) res.push([key, value[key]]);
            return snapify(res);
        }
        return value;
    }

    function prepImg(img) {
        img = img?.contents || img;
        if (!img || typeof(img) !== 'object' || !img.width || !img.height) throw Error('Expected an image as input');
        return img;
    }

    // ----------------------------------------------------------------------------

    class MediaPipe extends Extension {
        constructor(ide) {
            super('MediaPipe');
            this.ide = ide;
        }

        onOpenRole() {}

        getMenu() { return {}; }
        getCategories() { return []; }
        getLabelParts() { return []; }

        getPalette() {
            const blocks = [
                new Extension.Palette.Block('mediapipeLocateHands'),
            ];
            return [
                new Extension.PaletteCategory('sensing', blocks, SpriteMorph),
                new Extension.PaletteCategory('sensing', blocks, StageMorph),
            ];
        }

        getBlocks() {
            function block(name, type, category, spec, defaults, action) {
                return new Extension.Block(name, type, category, spec, defaults, action).for(SpriteMorph, StageMorph)
            }
            return [
                block('mediapipeLocateHands', 'reporter', 'sensing', 'locate hands %s', [], function (img) {
                    return this.runAsyncFn(async img => {
                        img = prepImg(img);

                        const handle = getHandsHandle();
                        const raw = await handle.infer(img);

                        const parseLandmarks = raw => raw.map(coords => coords.map(p => [p.x, p.y, p.z]));
                        const res = {
                            landmarks: parseLandmarks(raw.multiHandLandmarks),
                            worldLandmarks: parseLandmarks(raw.multiHandWorldLandmarks),
                            handedness: raw.multiHandedness.map(e => ({ index: e.index, score: e.score, label: e.label })),
                        };

                        console.log('res', res);

                        return snapify(res);
                    }, { args: [img], timeout: I32_MAX });
                }),
            ];
        }
    }

    const urls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
    ];
    for (const url of urls) {
        console.log(`MediaPipe - loading src ${url}`);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        document.body.appendChild(script);
    }

    NetsBloxExtensions.register(MediaPipe);
})();
