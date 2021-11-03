(function() {
    const [ide] = world.children;

    class RoboScapeSim extends Extension {
        constructor(ide) {  
            super('RoboScape Simulator');   
        }

        getMenu() {
            return {
                'New Room': function () {
                    if (!socket) {
                        connectToRoboScapeSim();
                    }

                    setTimeout(() => {
                        newRoom();
                    }, 200);
                },
                'Join Room': function () {
                    
                    if (!socket) {
                        connectToRoboScapeSim();
                    }

                    setTimeout(() => {
                        const dialog = new DialogBoxMorph().withKey('JoinRoboScapeSimRoom');
                        const roomIdField = new InputFieldMorph();
                        const roomPasswordField = new InputFieldMorph();
                        const bdy = new AlignmentMorph('column', this.padding);
                    
                        roomIdField.setWidth(200);

                        dialog.labelString = `Join Room`;
                        dialog.createLabel();


                        bdy.add(new TextMorph("Room ID:"));
                        bdy.add(roomIdField);
                        bdy.fixLayout();
                        dialog.addBody(bdy);

                        bdy.add(new TextMorph("Room Password:"));
                        bdy.add(roomPasswordField);
                        bdy.fixLayout();
                        dialog.addBody(bdy);

                        dialog.addButton('submit', 'Join Room');
                        dialog.submit = () => {
                            joinRoom(roomIdField.getValue());
                            dialog.destroy();
                        };
                        dialog.addButton('cancel', 'Close');
                        dialog.ok = () => this.grade(this.currentAssignment);
                        dialog.cancel = () => {
                            DialogBoxMorph.prototype.cancel.call(dialog);
                        };

                        dialog.fixLayout();
                        dialog.popUp(world);
                        
                    }, 200);
                },
                'Open 3D view': function () {
                    if (window.externalVariables.canvasInstance) {
                        window.externalVariables.canvasInstance.show();
                    }

                    if (!engine) {
                        activateBabylon();
                    }
                }
            };
        }

        getCategories() {
            return [];
        }

        getPalette() {
            return [];
        }

        getBlocks() {
            return [];
        }

        getLabelParts() {
            return [];
        }

    }

    // var script = document.createElement('script');
    // script.type = 'text/javascript';
    // script.src = 'src/geckos.io-client.1.7.2.min.js';
    // script.async = false;
    // document.body.appendChild(script);

    // if (typeof(BabylonBlocks) == 'undefined') {
    //     script = document.createElement('script');
    //     script.type = 'text/javascript';
    //     script.src = 'http://localhost:8080/src/babylon-ext.js';
    //     script.async = false;
    //     document.body.appendChild(script);
    // }

    if (typeof(CanvasMorph) == 'undefined') {
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://localhost:8080/src/babylon.js';
        script.async = false;
        document.body.appendChild(script);
    }


    script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'http://localhost:8080/src/roboscapesim3.js';
    script.async = false;
    document.body.appendChild(script);

    NetsBloxExtensions.register(RoboScapeSim);
})();
