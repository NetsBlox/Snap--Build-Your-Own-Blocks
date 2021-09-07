(function() {
    const [ide] = world.children;
    const stage = ide.stage;
    var peer;
    var seenPeers = [];

    class PeerJSBlocks extends Extension {
        constructor(ide) {  
            super('PeerJSBlocks');   

            // Add message types
            stage.addMessageType(new MessageType('peerConnected', ['id']));
            stage.addMessageType(new MessageType('peerMessage', ['id', 'data']));
        }

        getPalette() {
            const commonBlocks = [
                new Extension.Palette.Block('getPeerId'),
                new Extension.Palette.Block('connectToPeer'),
                new Extension.Palette.Block('sendToPeer'),
            ];

            return [
                new Extension.PaletteCategory(
                    'network',
                    [
                        ...commonBlocks,
                    ],
                    SpriteMorph
                ),
                new Extension.PaletteCategory(
                    'network',
                    [
                        ...commonBlocks,
                    ],
                    StageMorph
                ),
            ];
        }

        getBlocks() {
            return [
                new Extension.Block(
                    'getPeerId',
                    'reporter',
                    'network',
                    'my peer id',
                    [],
                    function() {
                        return peer.id;
                    }
                ).for(SpriteMorph, SpriteMorph),
                new Extension.Block(
                    'connectToPeer',
                    'command',
                    'network',
                    'connect to peer %peerid',
                    [],
                    function(dest) {
                        peer.connect(dest);
                    }
                ).for(SpriteMorph, SpriteMorph),
                new Extension.Block(
                    'sendToPeer',
                    'command',
                    'network',
                    'send %msgContent to %peerid',
                    [],
                    function(msg, dest) {
                        peer.connections[dest][0]?.send(msg);
                    }
                ).for(SpriteMorph, SpriteMorph),
            ];
        }

        getLabelParts() {
            return [
                new Extension.LabelPart(
                    '%peerid',
                    () => {
                        const part = new InputSlotMorph(
                            '', // text
                            false, // non-numeric
                            null,
                            false
                        );
                        return part;
                    }
                ),
                new Extension.LabelPart(
                    '%msgContent',
                    () => {
                        const part = new InputSlotMorph(
                            '', // text
                            false, // non-numeric
                            null,
                            false
                        );
                        return part;
                    }
                ),
            ];
        }

    }

    NetsBloxExtensions.register(PeerJSBlocks);

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js';
    script.async = false;
    script.onload = () => {
        peer = new Peer("peer" + SnapCloud.clientId);

        // Link up to NetsBlox messages
        peer.on('connection', function(conn) {
            console.log(conn);

            if(!seenPeers.includes(conn.peer)){
                peer.connect(conn.peer);
                seenPeers.push(conn.peer);
            }

            ide.sockets.onMessageReceived('peerConnected', {id: conn.peer}, []);

            conn.on('data', function(data){
                console.log(data);
                ide.sockets.onMessageReceived('peerMessage', {id: conn.peer, data}, []);
            });
        });

          
    }
    document.body.appendChild(script);
})();
