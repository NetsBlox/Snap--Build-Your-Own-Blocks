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
                new Extension.Palette.Block('mediapipeRenderHands'),
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

                        const parseLandmarks = coords => coords.map(p => [p.x, p.y, p.z]);

                        const res = [];
                        for (let i = 0; i < raw.multiHandLandmarks.length; ++i) {
                            res.push({
                                cameraSpace: parseLandmarks(raw.multiHandLandmarks[i]),
                                worldSpace: parseLandmarks(raw.multiHandWorldLandmarks[i]),
                                hand: raw.multiHandedness[i].label,
                                handConfidence: raw.multiHandedness[i].score,
                            });
                        }

                        return snapify(res);
                    }, { args: [img], timeout: I32_MAX });
                }),
                block('mediapipeRenderHands', 'reporter', 'sensing', 'render hands %l onto img %s', [], function (hands, img) {
                    return this.runAsyncFn(async (hands, img) => {
                        hands = listToArray(hands);
                        img = prepImg(img);

                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const context = canvas.getContext('2d');

                        context.drawImage(img, 0, 0, canvas.width, canvas.height);
                        for (const hand of hands) {
                            if (!hand) continue;
                            const landmarks = hand[0][1].map(xyz => ({ x: xyz[0], y: xyz[1], z: xyz[2] }));
                            drawConnectors(context, landmarks, HAND_CONNECTIONS, { color: '#00ff00', lineWidth: 3 });
                            drawLandmarks(context, landmarks, { color: '#ff0000', lineWidth: 1 });
                        }

                        return new Costume(canvas);
                    }, { args: [hands, img], timeout: I32_MAX });
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
