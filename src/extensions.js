/*globals SpriteMorph, Process, StageMorph*/
(function(globals) {
    class ExtensionRegistry {
        constructor() {
            this.ide = null;
            this.registry = [];
            this.pendingExtensions = [];
            // We will track the current non-trivial events so extensions that
            // have been loaded async and missed the init event can still be
            // "brought up to speed"
            this.eventQueue = [];
        }

        initialize(ide) {
            this.ide = ide;
            this.pendingExtensions.forEach(ext => this.load(ext));
            this.pendingExtensions = [];
            this.eventQueue = [];
        }

        load(Extension) {
            // First, check if the extension is supported
            const supported = Extension.prototype.isSupported();
            if (supported !== true) {
                if(typeof supported === 'string'){
                    this.ide.showMessage(`Unable to load extension: ${supported}`);
                } else {
                    this.ide.showMessage(`Unable to load extension.`);
                }
                
                return;
            }

            const extension = new Extension(this.ide);  // TODO: Replace the IDE with an official API?
            if (this.isLoaded(extension.name)) {
                return;
            }

            try {
                this.validate(extension);
            } catch (err) {
                this.ide.showMessage(`Unable to load extension "${extension.name}": ${err.message}`);
                return;
            }

            this.registry.push(extension);
            // TODO: Request permissions? Wrap the IDE?
            // TODO: Add an about section? What if there is no menu?
            this.ide.controlBar.extensionsButton.show();

            extension.getCategories()
                .forEach(category => this.registerCategory(category));

            this.ide.createCategories();
            this.ide.createCorralBar();
            this.ide.fixLayout();
            SpriteMorph.prototype.initBlocks();

            this.eventQueue.forEach(eventHandler => extension[eventHandler]());
        }

        onNewProject() {
            this.registry.forEach(ext => ext.onNewProject());
            // Since this is called after onOpenRole, it is problematic
            // to track this event in the queue.
            // TODO: detect project opening
            // this.eventQueue = ['onNewProject'];
        }

        onOpenRole() {
            this.registry.forEach(ext => ext.onOpenRole());

            if (!this.eventQueue.includes('onOpenRole')) {
                this.eventQueue = ['onOpenRole'];
            }
        }

        // The following events shouldn't need to be queue since
        // the state of the project is available during one of
        // the other initialization events (ie, onOpenRole)
        onNewSprite(sprite) {
            this.registry.forEach(ext => ext.onNewSprite(sprite));
        }

        onRenameSprite(spriteId, name) {
            this.registry.forEach(ext => ext.onRenameSprite(spriteId, name));
        }

        onSetStageSize(width, height) {
            this.registry.forEach(ext => ext.onSetStageSize(width, height));
        }

        // Transient events
        onRunScripts() {
            this.registry.forEach(ext => ext.onRunScripts());
        }

        onStopAllScripts() {
            this.registry.forEach(ext => ext.onStopAllScripts());
        }

        onPauseAll() {
            this.registry.forEach(ext => ext.onPauseAll());
        }

        onResumeAll() {
            this.registry.forEach(ext => ext.onResumeAll());
        }

        register(Extension) {
            if (this.isReady()) {
                this.load(Extension);
            } else {
                this.pendingExtensions.push(Extension);
            }
        }

        isReady() {
            return !!this.ide;
        }

        validate(extension) {
            const palettes = extension.getPalette();

            extension.getBlocks().forEach(block => {
                const alreadyExists = SpriteMorph.prototype[block.name] ||
                    StageMorph.prototype[block.name] || Process.prototype[block.name];

                if (alreadyExists) {
                    throw new Error(`Cannot override existing "${block.name}" block`);
                }

                const receivers = this.findWatcherReceivers(palettes, block.name);
                receivers.forEach(rcvr => {
                    if (!block.receivers.includes(rcvr)) {
                        const msg = `Cannot add a watcher toggle for "${block.spec}" on ${rcvr.name}.` +
                            ` Did you forget to add ".for(${rcvr.name})" when defining the block?`;
                        throw new Error(msg);
                    }
                });
            });
        }

        isLoaded(name) {
            return this.registry.find(ext => ext.name === name);
        }

        getLabelPart(spec) {
            const part = this.registry.flatMap(ext => ext.getLabelParts()).find(part => part.spec === spec);
            if (part) {
                return part.factory(spec);
            }
        }

        registerCategory(category) {
            const {name, color} = category;
            // TODO: refactor this so we can unregister extensions
            SpriteMorph.prototype.categories.splice(
                SpriteMorph.prototype.categories.length-3,
                0,
                name
            );
            SpriteMorph.prototype.blockColor[name] = color;
        }

        getPaletteContents(targetObject, categoryName) {
            const paletteContents = this.registry.flatMap(ext => ext.getPalette())
                .filter(paletteCat => paletteCat.isVisible(targetObject, categoryName))
                .flatMap(paletteCat => paletteCat.contents);

            return paletteContents;
        }

        findWatcherReceivers(palettes, spec) {
            const receivers = palettes
                .filter(p => p.contents.find(block => block.type === 'watcher' && block.name === spec))
                .map(palette => palette.targetObject)
                .reduce((rcvrs, next) => {
                    if (!rcvrs.includes(next)) {
                        rcvrs.push(next);
                    }
                    return rcvrs;
                }, []);
            return receivers;
        }

        initBlocks() {
            // TODO: refactor this so we can unregister extensions
            const allBlocks = this.registry.flatMap(ext => ext.getBlocks());
            const palettes = this.registry.flatMap(ext => ext.getPalette());

            allBlocks.forEach(block => {
                SpriteMorph.prototype.blocks[block.name] = {
                    type: block.type,
                    category: block.category,
                    spec: block.spec,
                    defaults: block.defaults,
                    help: block.help,
                    terminal: block.isTerminal,
                };
                const receivers = this.findWatcherReceivers(palettes, block.name);
                receivers.forEach(rcvr => {
                    if (!block.receivers.includes(rcvr)) {
                        const msg = `Cannot add a watcher toggle for ${block.spec} on ${rcvr.name}.` +
                            ` Did you forget to add ".for(${rcvr.name})" when defining the block?`;
                        throw new Error(msg);
                    }
                });

                if (receivers.length === 0) {
                    receivers.push(Process);
                }
                receivers.forEach(Rcvr => Rcvr.prototype[block.name] = block.impl);
            });
        }

        getUserMenu(target, menu) {
            const userMenu = this.registry.flatMap(ext => ext.getUserMenu(target));

            if (userMenu.length > 0) {
                if(menu.items.length > 0){
                    menu.addLine();   
                }

                userMenu.forEach(item => menu.addItem(item[0], item[1]));
            }
        }
    }

    function Extension (name) {
        this.name = name;
    }

    Extension.prototype.getMenu = function() {
        return null;
    };

    Extension.prototype.getSettings = function() {
        return [];
    };

    Extension.prototype.getCategories = function() {
        return [];
    };

    Extension.prototype.getBlocks = function() {
        return [];
    };

    Extension.prototype.getPalette = function(/*target, category*/) {
        return [];
    };

    Extension.prototype.getLabelParts = function() {
        return [];
    };

    Extension.prototype.getUserMenu = function(target) {
        return [];
    };

    Extension.prototype.onRunScripts =
    Extension.prototype.onStopAllScripts =
    Extension.prototype.onPauseAll =
    Extension.prototype.onResumeAll =
    Extension.prototype.onNewSprite =
    Extension.prototype.onRenameSprite =
    Extension.prototype.onSetStageSize = 
    Extension.prototype.onNewProject =
    Extension.prototype.onOpenRole = function() {
    };

    Extension.prototype.triggerHatBlock = function(selector) {
        let stage = NetsBloxExtensions.ide.stage;
        stage.children.concat(stage).forEach(morph => {
            if (isSnapObject(morph)) {
                morph.allHatBlocksFor(selector, true).forEach(block =>
                    stage.threads.startProcess(
                        block,
                        morph,
                        stage.isThreadSafe
                    )
                );
            }
        });
    }

    Extension.prototype.isSupported = function() {
        return true;
    };

    class ExtensionSetting {
        constructor(label, toggle, test, onHint = '', offHint = '', hide = false) {
            this.label = label;
            this.toggle = toggle, 
            this.test = test, 
            this.onHint = onHint, 
            this.offHint = offHint, 
            this.hide = hide
        }
    }

    ExtensionSetting.createFromLocalStorage = function(label, id, defaultValue = false, onHint = '', offHint = '', hide = false){
        return new ExtensionSetting(
            label,
            () => {
                window.localStorage.setItem(id, !(window.localStorage.getItem(id) ?? defaultValue));
            },
            () => window.localStorage.getItem(id) ?? defaultValue,
            onHint, offHint, hide);
    }

    Extension.ExtensionSetting = ExtensionSetting;

    class LabelPart {
        constructor(spec, fn) {
            if (spec[0] !== '%') {
                spec = '%' + spec;
            }
            this.spec = spec;
            this.factory = fn;
        }
    }

    class PaletteCategory {
        constructor(category, contents, targetObject) {
            this.category = category;
            this.contents = contents;
            this.targetObject = targetObject;
        }

        isVisible(target, category) {
            return this.category === category && (!this.targetObject || target instanceof this.targetObject);
        }
    }

    class CustomBlock {
        constructor(name, type, category, spec, defaults=[], impl, help = null) {
            this.name = name;
            this.type = type;
            this.category = category;
            this.spec = spec;
            this.defaults = defaults;
            this.impl = impl;
            this.receivers = [];
            this.help = help;
            this.isTerminal = false;
        }

        help(info) {
            this.help = info;
            return this;
        }

        terminal() {
            this.isTerminal = true;
            return this;
        }

        for(...receivers) {
            this.receivers = receivers;
            return this;
        }
    }

    class Category {
        constructor(name, color = new Color(120, 120, 120)) {
            this.name = name;
            this.color = color;
        }
    }

    class PaletteBlock {
        constructor(name) {
            this.name = name;
            this.type = 'block';
        }

        withWatcherToggle() {
            this.type = 'watcher';
            return this;
        }
    }

    Extension.PaletteCategory = PaletteCategory;
    Extension.Palette = {};
    Extension.Palette.Block = PaletteBlock;
    Extension.Palette.Space = {name: '-', type: 'space'};
    Extension.Palette.BigSpace = {name: '=', type: 'space'};
    Extension.Block = CustomBlock;
    Extension.Category = Category;
    Extension.LabelPart = LabelPart;

    globals.Extension = Extension;
    globals.ExtensionRegistry = ExtensionRegistry;
    globals.NetsBloxExtensions = new ExtensionRegistry();

})(this);
