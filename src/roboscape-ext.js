(function() {
    const [ide] = world.children;

    class RoboScapeSim extends Extension {
        constructor(ide) {  
            super('RoboScape Simulator');   
        }

        getMenu() {
            return {
                'New Room': function () {
                    if (!geckosSocket) {
                        connectToRoboScapeSim();
                    }
                    newRoom();
                },
                'Join Room': function () {
                    
                    if (!geckosSocket) {
                        connectToRoboScapeSim();
                    }
                    
                    const dialog = new DialogBoxMorph().withKey('JoinRoboScapeSimRoom');
                    const roomIdField = new InputFieldMorph();
                    const bdy = new AlignmentMorph('column', this.padding);
                    
                    roomIdField.setWidth(200);

                    dialog.labelString = `Join Room`;
                    dialog.createLabel();

                    bdy.add(roomIdField);
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
                },
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

    NetsBloxExtensions.register(RoboScapeSim);
})();
