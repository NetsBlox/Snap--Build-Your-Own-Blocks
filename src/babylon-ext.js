(function() {
    const [ide] = world.children;

    class BabylonBlocks extends Extension {
        constructor(ide) {  
            super('BabylonBlocks');   
        }

        // getMenu() {
        //     return {
        //         'hello!': function() {},
        //     };
        // }

        getCategories() {
            return [
                new Extension.Category(
                    '3D',
                    new Color(10, 100, 10),
                )
            ];
        }

        getPalette() {
            return [
                new Extension.PaletteCategory(
                    '3D',
                    [
                        new Extension.Palette.Block('set3DShape'),
                    ],
                    SpriteMorph
                ),
                new Extension.PaletteCategory(
                    '3D',
                    [
                        new Extension.Palette.Block('setGravity'),
                    ],
                    StageMorph
                ),
            ];
        }

        getBlocks() {
            return [
                new Extension.Block(
                    'set3DShape',
                    'command',
                    '3D',
                    'set shape to %3dshape',
                    ['sphere'],
                    () => 'This is a test.'
                ).for(SpriteMorph),
                new Extension.Block(
                    'setGravity',
                    'command',
                    '3D',
                    'set gravity to %grav',
                    [9.81],
                    (value) => {
                        // set physics engine gravity
                        scene._physicsEngine.gravity.y = -value;
                    }
                ).for(SpriteMorph)
            ];
        }

        getLabelParts() {
            return [
                new Extension.LabelPart(
                    '%3dshape',
                    () => {
                        const part = new InputSlotMorph(
                            null, // text
                            false, // non-numeric
                            {
                                'sphere': ['sphere'],
                                'cube': ['cube']
                            },
                            false
                        );
                        part.setContents('sphere');
                        return part;
                    }
                ),
                new Extension.LabelPart(
                    '%grav',
                    () => {
                        const part = new InputSlotMorph(
                            null, // text
                            true, // non-numeric
                            {
                                '9.81': 9.81,
                                '0': '0'
                            },
                            false
                        );
                        part.setContents(9.81);
                        return part;
                    }
                ),
            ];
        }

    }

    NetsBloxExtensions.register(BabylonBlocks);
})();
