/* globals driver, expect */
describe('undo', function() {
    let SnapUndo, SnapActions, Point;
    before(() => {
        SnapUndo = driver.globals().SnapUndo;
        Point = driver.globals().Point;
        SnapActions = driver.globals().SnapActions;
    });

    beforeEach(() => driver.reset());

    describe('reset position', function() {
        let block, initialPosition;

        beforeEach(async () => {
            block = await driver.addBlock('forward');
            initialPosition = block.position().copy();
        });

        it('should restore pos after moveBlock (top)', async function() {
            const bottomBlock = await driver.addBlock('doSayFor', new Point(300, 300));
            const [target] = bottomBlock.attachTargets();
            await SnapActions.moveBlock(block, target);
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();
            await SnapUndo.undo(undoId);
            await driver.expect(
                () => initialPosition.eq(block.position()),
                `Block not restored to ${initialPosition} (${block.position()})`
            );
        });

        it('should restore pos after moveBlock (block)', async function() {
            const bottomBlock = await driver.addBlock('doSayFor', new Point(300, 300));
            const [, , target] = bottomBlock.attachTargets();
            await SnapActions.moveBlock(block, target);
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();
            await SnapUndo.undo(undoId);
            await driver.expect(
                () => initialPosition.eq(block.position()),
                `Block not restored to ${initialPosition} (${block.position()})`
            );
        });

        it('should restore pos after setBlockPosition', async function() {
            await driver.dragAndDrop(block, new Point(300, 300));
            await driver.actionsSettled();
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();

            await SnapUndo.undo(undoId);
            await driver.waitUntil(() => SnapUndo.undoCount[undoId] === 1);
            const msg = `Block not restored to ${initialPosition} (${block.position()})`;
            expect(initialPosition.eq(block.position())).toBe(true, msg);
        });

        it('should restore pos after moveBlock, setBlockPosition', async function() {
            const bottomBlock = await driver.addBlock('doSayFor', new Point(300, 300));
            const [target] = bottomBlock.attachTargets();
            await SnapActions.moveBlock(block, target);
        });

        it('should restore pos after connecting to another block', async function() {
            const bottomBlock = await driver.addBlock('doSayFor', new Point(300, 300));
            const [topTarget] = bottomBlock.attachTargets();
            await SnapActions.moveBlock(block, topTarget);
            await SnapActions.setBlockPosition(block, new Point(400, 400));
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();
            await SnapUndo.undo(undoId);
            await driver.expect(
                () => initialPosition.eq(block.position()),
                `Block not restored to ${initialPosition} (${block.position()})`
            );
        });
    });

    describe('replace inputs', function() {
        let command, firstInput;

        beforeEach(async () => {
            command = await driver.addBlock('forward');
            firstInput = await driver.addBlock('xPosition', new Point(600, 600));
            const [inputSlot] = command.inputs();
            await driver.dragAndDrop(firstInput, inputSlot.position());
            await driver.actionsSettled();
        });

        it('should revert (existing) input on undo', async function() {
            const input = await driver.addBlock('yPosition', new Point(500, 500));
            const startPos = input.position();
            const [inputSlot] = command.inputs();
            await driver.dragAndDrop(input, inputSlot.position());
            await driver.actionsSettled();
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();
            await SnapUndo.undo(undoId);
            await driver.waitUntil(() => SnapUndo.undoCount[undoId] === 1);
            let msg = `Input should be reverted to x position block`;
            expect(command.inputs()[0]).toBe(firstInput, msg);
            msg = `Expected block to be moved back to ${startPos} (not ${input.position()})`;
            expect(startPos.eq(input.position())).toBe(true, msg);
        });

        it('should revert (new) input on undo', async function() {
            // TODO:
        });
    });

    describe('call RPC blocks', function() {
        let block;
        beforeEach(async () => {
            this.timeout(15000);
            block = await driver.addBlock('getJSFromRPCStruct');
            await selectServiceAndRPC(block, 'CloudVariables', 'setVariable');
        });

        it('should clear RPC field on service field change', async function() {
            await selectService(block, 'PublicRoles');
            const [rpcName] = block.inputs()[1].evaluate();
            expect(rpcName).toNotBe('setVariable');
        });

        it('should reset RPC field on undo service field change', async function() {
            await selectService(block, 'PublicRoles');
            const undoId = driver.ide().currentSprite.scripts.undoOwnerId();
            await SnapUndo.undo(undoId);
            await driver.expect(
                () => {
                    const [rpcName] = block.inputs()[1].evaluate();
                    return rpcName === 'setVariable';
                },
                'RPC field not reset on undo service'
            );
        });

        it('should restore inputs on undo RPC field change', function() {
        });

        async function selectServiceAndRPC(block, service, rpc) {
            await selectService(block, service);
            await driver.expect(
                async () => {
                    driver.click(block.inputs()[1]);
                    const dialog = await driver.expect(
                        () => driver.dialog(),
                        'RPC menu did not show up'
                    );

                    const rpcs = dialog.children
                        .map(child => child.label && child.label.text);
                    dialog.destroy();
                    return rpcs.includes(rpc);
                },
                `Did not find RPC ${rpc}`
            );
            await selectRPC(block, rpc);
        }

        async function selectService(block, service) {
            driver.click(block.inputs()[0]);
            const dialog = await driver.expect(
                () => driver.dialog(),
                'Did not find services menu'
            );
            const serviceItem = dialog.children
                .find(child => child.label && child.label.text === service);
            driver.click(serviceItem);
        }

        async function selectRPC(block, rpc) {
            driver.click(block.inputs()[1]);
            const dialog = await driver.expect(
                () => driver.dialog(),
                'Did not find RPCs menu'
            );
            const rpcItem = dialog.children
                .find(child => child.label && child.label.text === rpc);
            driver.click(rpcItem);
        }
    });
});
