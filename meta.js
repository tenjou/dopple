"use strict";

var meta = {
    version: "0.82 nightly",
    importUrl: "http://meta2d.com/store/",
    device: null,
    resources: null,
    renderer: null,
    camera: null,
    input: null,
    physics: null,
    channels: [],
    modules: {},
    loading: null,
    preloading: null,
    flags: {
        webGL: true,
        audioAPI: true,
        culling: true
    },
    time: {
        delta: 0,
        deltaF: 0,
        maxDelta: 250,
        scale: 1,
        curr: 0,
        fps: 0,
        current: 0,
        update: 0,
        accumulator: 0,
        frameIndex: 0,
        updateFreq: 1e3 / 10
    },
    /* cache */
    cache: {
        width: 0,
        height: 0,
        metaTagsAdded: false,
        timerIndex: 0,
        initFuncs: [],
        preloadFuncs: [],
        loadFuncs: [],
        readyFuncs: [],
        view: null,
        views: {},
        scripts: null,
        pendingScripts: null,
        numScriptsToLoad: 0,
        resolutions: null,
        currResolution: null,
        imageSmoothing: true
    },
    set onInit(func) {
        this.cache.initFuncs.push(func);
        if (this.engine && this.engine.inited) {
            func();
        }
    },
    set onPreload(func) {
        this.cache.preloadFuncs.push(func);
        if (this.engine && this.engine.preloaded) {
            func();
        }
    },
    set onLoad(func) {
        this.cache.loadFuncs.push(func);
        if (this.engine && this.engine.loaded) {
            func();
        }
    },
    set onReady(func) {
        this.cache.readyFuncs.push(func);
        if (this.engine && this.engine.ready) {
            func();
        }
    },
    set onUpdate(func) {
        this.engine.updateFuncs.push(func);
    },
    set onRender(func) {
        this.engine.renderFuncs.push(func);
    },
    set debug(value) {
        if (this.cache.debug === value) {
            return;
        }
        this.cache.debug = value;
        if (value) {
            meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
            meta.debugger.load();
        } else {
            meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
            meta.debugger.unload();
        }
    },
    get debug() {
        return this.cache.debug;
    }
};

"use strict";

(function(scope) {
    if (!scope.meta) {
        scope.meta = {};
    }
    var initializing = false;
    var fnTest = /\b_super\b/;
    var holders = {};
    meta.class = function(clsName, extendName, prop, cb) {
        if (!initializing) {
            meta.class._construct(clsName, extendName, prop, cb);
        }
    };
    meta.class._construct = function(clsName, extendName, prop, cb) {
        if (!clsName) {
            console.error("(meta.class) Invalid class name");
            return;
        }
        if (!prop) {
            prop = extendName;
            extendName = null;
        }
        if (!prop) {
            prop = {};
        }
        var extend = null;
        if (extendName) {
            var prevScope = null;
            var extendScope = window;
            var extendScopeBuffer = extendName.split(".");
            var num = extendScopeBuffer.length - 1;
            for (var n = 0; n < num; n++) {
                prevScope = extendScope;
                extendScope = extendScope[extendScopeBuffer[n]];
                if (!extendScope) {
                    extendScope = {};
                    prevScope[extendScopeBuffer[n]] = extendScope;
                }
            }
            var name = extendScopeBuffer[num];
            extend = extendScope[name];
            if (!extend) {
                var holder = holders[extendName];
                if (!holder) {
                    holder = new ExtendHolder();
                    holders[extendName] = holder;
                }
                holder.classes.push(new ExtendItem(clsName, prop, cb));
                return;
            }
        }
        Extend(clsName, extend, prop, cb);
    };
    function Extend(clsName, extend, prop, cb) {
        var prevScope = null;
        var scope = window;
        var scopeBuffer = clsName.split(".");
        var num = scopeBuffer.length - 1;
        var name = scopeBuffer[num];
        for (var n = 0; n < num; n++) {
            prevScope = scope;
            scope = scope[scopeBuffer[n]];
            if (!scope) {
                scope = {};
                prevScope[scopeBuffer[n]] = scope;
            }
        }
        var extendHolder = holders[clsName];
        var prevCls = scope[name];
        var cls = function Class(a, b, c, d, e, f) {
            if (!initializing) {
                if (this.init) {
                    this.init(a, b, c, d, e, f);
                }
            }
        };
        var proto = null;
        var extendProto = null;
        if (extend) {
            initializing = true;
            proto = new extend();
            extendProto = proto.__proto__;
            initializing = false;
        } else {
            initializing = true;
            proto = new meta.class();
            initializing = false;
        }
        for (var key in prop) {
            var p = Object.getOwnPropertyDescriptor(prop, key);
            if (p.get || p.set) {
                Object.defineProperty(proto, key, p);
                continue;
            }
            if (extend) {
                if (typeof prop[key] == "function" && typeof extendProto[key] == "function" && fnTest.test(prop[key])) {
                    proto[key] = function(key, fn) {
                        return function(a, b, c, d, e, f) {
                            var tmp = this._super;
                            this._super = extendProto[key];
                            this._fn = fn;
                            var ret = this._fn(a, b, c, d, e, f);
                            this._super = tmp;
                            return ret;
                        };
                    }(key, prop[key]);
                    continue;
                }
            }
            proto[key] = prop[key];
        }
        cls.prototype = proto;
        cls.prototype.__name__ = clsName;
        cls.prototype.__lastName__ = name;
        cls.prototype.constructor = proto.init || null;
        scope[name] = cls;
        if (prevCls) {
            for (var key in prevCls) {
                cls[key] = prevCls[key];
            }
        }
        if (extendHolder) {
            var extendItem = null;
            var classes = extendHolder.classes;
            num = classes.length;
            for (n = 0; n < num; n++) {
                extendItem = classes[n];
                Extend(extendItem.name, cls, extendItem.prop, extendItem.cb);
            }
            delete holders[clsName];
        }
        if (cb) {
            cb(cls, clsName);
        }
    }
    function ExtendHolder() {
        this.classes = [];
    }
    function ExtendItem(name, prop, cb) {
        this.name = name;
        this.prop = prop;
        this.cb = cb;
    }
    meta.classLoaded = function() {
        var i = 0;
        var holder = null;
        var classes = null;
        var numClasses = 0;
        for (var key in holders) {
            holder = holders[key];
            console.error("Undefined class: " + key);
            classes = holder.classes;
            numClasses = classes.length;
            for (i = 0; i < numClasses; i++) {
                console.error("Undefined class: " + classes[i].name);
            }
        }
        holder = {};
    };
})(typeof window !== void 0 ? window : global);

"use strict";

meta.engine = {
    create: function() {
        this._container = document.body;
        this._container.style.cssText = this.elementStyle;
        this.parseFlags();
        this._createRenderer();
        this._printInfo();
        if (this.autoMetaTags) {
            this._addMetaTags();
        }
        this.onUpdate = meta.createChannel(meta.Event.UPDATE);
        this.onResize = meta.createChannel(meta.Event.RESIZE);
        this.onAdapt = meta.createChannel(meta.Event.ADAPT);
        this.onBlur = meta.createChannel(meta.Event.BLUR);
        this.onFocus = meta.createChannel(meta.Event.FOCUS);
        this.onFullscreen = meta.createChannel(meta.Event.FULLSCREEN);
        this.onDebug = meta.createChannel(meta.Event.DEBUG);
        var self = this;
        this.cb = {
            resize: function(event) {
                self.updateResolution();
            },
            focus: function(event) {
                self.handleFocus(true);
            },
            blur: function(event) {
                self.handleFocus(false);
            }
        };
        window.addEventListener("resize", this.cb.resize, false);
        window.addEventListener("orientationchange", this.cb.resize, false);
        if (meta.device.hidden) {
            this.cb.visibilityChange = function() {
                self.handleVisibilityChange();
            };
            document.addEventListener(meta.device.visibilityChange, this.cb.visibilityChange);
        }
        window.addEventListener("focus", this.cb.focus);
        window.addEventListener("blur", this.cb.blur);
        if (meta.device.support.fullScreen) {
            this.cb.fullscreen = function() {
                self.onFullScreenChangeCB();
            };
            document.addEventListener(meta.device.fullScreenOnChange, this.cb.fullscreen);
        }
        meta.camera = new meta.Camera();
        meta.world = new meta.World(0, 0);
        meta.resources = new Resource.Manager();
        meta.input = new Input.Manager();
        meta.physics = new Physics.Manager();
        var resources = meta.resources;
        resources.onLoadingStart.add(this.onLoadingStart, this);
        resources.onLoadingEnd.add(this.onLoadingEnd, this);
        this.sortAdaptions();
        this.updateResolution();
        this._initAll();
    },
    parseFlags: function() {
        var flag, flagName, flagValue, flagSepIndex;
        var flags = window.location.hash.substr(1).split(",");
        var num = flags.length;
        for (var n = 0; n < num; n++) {
            flag = flags[n];
            flagSepIndex = flag.indexOf("=");
            if (flagSepIndex > 0) {
                flagName = flag.substr(0, flagSepIndex).replace(/ /g, "");
                flagValue = eval(flag.substr(flagSepIndex + 1).replace(/ /g, ""));
                meta.flags[flagName] = flagValue;
            }
        }
    },
    _initAll: function() {
        this.time.current = Date.now();
        var cache = meta.cache;
        var masterView = new meta.View("master");
        cache.views["master"] = masterView;
        cache.view = masterView;
        var ctrlInfo;
        var ctrlsToCreate = cache.ctrlsToCreate;
        var num = ctrlsToCreate.length;
        for (var n = 0; n < num; n++) {
            ctrlInfo = ctrlsToCreate[n];
            ctrlInfo.scope[ctrlInfo.cls.prototype.name] = new ctrlInfo.cls();
        }
        cache.ctrlsToCreate = null;
        num = cache.initFuncs.length;
        for (n = 0; n < num; n++) {
            cache.initFuncs[n]();
        }
        cache.initFuncs = null;
        console.log(" ");
        this.flags |= this.Flag.INITED;
        this._loadAll();
    },
    _loadAll: function() {
        if (!meta._loadAllScripts()) {
            this._handlePreload();
        }
    },
    _handlePreload: function() {
        this.meta.renderer.load();
        this.meta.input.onDown.add(this.handleKeyDown, this);
        var cache = meta.cache;
        var numFuncs = cache.preloadFuncs.length;
        for (var i = 0; i < numFuncs; i++) {
            cache.preloadFuncs[i]();
        }
        var masterView = meta.cache.view;
        masterView.flags |= masterView.Flag.ACTIVE;
        masterView._activate();
        this._startMainLoop();
        if (!meta.resources.loading) {
            this._handleLoad();
        }
    },
    _handleLoad: function() {
        this.flags |= this.Flag.PRELOADED;
        var cache = meta.cache;
        var numFuncs = cache.loadFuncs.length;
        for (var i = 0; i < numFuncs; i++) {
            cache.loadFuncs[i]();
        }
        this.loadPlugins();
        if (!meta.resources.loading) {
            this._handleReady();
        }
    },
    _handleReady: function() {
        this.flags |= this.Flag.LOADED;
        this.readyPlugins();
        var numFuncs = meta.cache.readyFuncs.length;
        for (var i = 0; i < numFuncs; i++) {
            meta.cache.readyFuncs[i]();
        }
        this.flags |= this.Flag.READY;
        meta.renderer.needRender = true;
    },
    loadPlugins: function() {
        var num = this.plugins.length;
        for (var n = 0; n < num; n++) {
            this.plugins[n].load();
        }
    },
    readyPlugins: function() {
        var num = this.plugins.length;
        for (var n = 0; n < num; n++) {
            this.plugins[n].ready();
        }
    },
    _startMainLoop: function() {
        var self = this;
        this._renderLoop = function() {
            self.render();
        };
        this.render();
    },
    update: function(tDelta) {
        var n, num;
        this._updateTimers(meta.time.delta);
        if (this.flags & this.Flag.READY) {
            num = this.controllersReady.length;
            if (num > 0 && !this.meta.resources.loading) {
                var controller;
                for (n = 0; n < this.controllersReady.length; n++) {
                    controller = this.controllersReady[n];
                    if (controller.flags & controller.Flag.LOADED) {
                        controller.ready();
                    }
                }
                this.controllersReady.length = 0;
            }
        }
        num = this.updateFuncs.length;
        for (n = 0; n < num; n++) {
            this.updateFuncs[n](tDelta);
        }
        num = this.controllersUpdate.length;
        for (n = 0; n < num; n++) {
            this.controllersUpdate[n].onUpdate(tDelta);
        }
        this.onUpdate.emit(tDelta);
        this.meta.renderer.update(tDelta);
        this.meta.camera.update(tDelta);
    },
    render: function() {
        this.time.frameIndex++;
        var tNow = Date.now();
        if (this.time.pause) {
            this.time.delta = 0;
            this.time.deltaF = 0;
        } else {
            this.time.delta = tNow - this.time.current;
            if (this.time.delta > this.time.maxDelta) {
                this.time.delta = this.time.maxDelta;
            }
            this.time.delta *= this.time.scale;
            this.time.deltaF = this.time.delta / 1e3;
            this.time.accumulator += this.time.delta;
        }
        if (tNow - this.time.fps >= 1e3) {
            this.time.fps = tNow;
            this.fps = this._fpsCounter;
            this._fpsCounter = 0;
        }
        this.update(this.time.deltaF);
        meta.renderer.render(this.time.deltaF);
        var num = this.renderFuncs.length;
        for (var n = 0; n < num; n++) {
            this.renderFuncs[n](this.time.tDeltaF);
        }
        this._fpsCounter++;
        this.time.current = tNow;
        requestAnimationFrame(this._renderLoop);
    },
    _updateTimers: function(tDelta) {
        var timer, index, n;
        var numTimers = this.timers.length;
        var numRemove = this.timersRemove.length;
        if (numRemove > 0) {
            var itemsLeft = numTimers - numRemove;
            if (itemsLeft > 0) {
                var index;
                for (var n = 0; n < numRemove; n++) {
                    index = this.timers.indexOf(this.timersRemove[n]);
                    if (index < itemsLeft) {
                        this.timers.splice(index, 1);
                    } else {
                        this.timers.pop();
                    }
                }
            } else {
                this.timers.length = 0;
            }
            numTimers = itemsLeft;
            this.timersRemove.length = 0;
        }
        for (n = 0; n < numTimers; n++) {
            timer = this.timers[n];
            if (timer.paused) {
                continue;
            }
            timer.tAccumulator += tDelta;
            while (timer.tAccumulator >= timer.tDelta) {
                timer.tAccumulator -= timer.tDelta;
                if (timer.numTimes !== 0) {
                    timer.func.call(timer.owner, timer);
                }
                timer.tStart += timer.tDelta;
                if (timer.numTimes !== -1) {
                    timer.numTimes--;
                    if (timer.numTimes <= 0) {
                        this.timersRemove.push(timer);
                        timer.__index = -1;
                        break;
                    }
                }
            }
        }
    },
    sortAdaptions: function() {
        var scope = meta;
        var resolutions = scope.cache.resolutions;
        if (!resolutions) {
            return;
        }
        var numResolutions = resolutions.length;
        if (numResolutions <= 1) {
            return;
        }
        resolutions.sort(function(a, b) {
            var length_a = scope.math.length2(a.width, a.height);
            var length_b = scope.math.length2(b.width, b.height);
            return length_a - length_b;
        });
        var lowestResolution = resolutions[0];
        var reso, prevReso;
        for (var i = 1; i < numResolutions; i++) {
            prevReso = resolutions[i - 1];
            reso = resolutions[i];
            reso.unitSize = reso.height / lowestResolution.height;
            reso.zoomThreshold = prevReso.unitSize + (reso.unitSize - prevReso.unitSize) / 100 * 33;
        }
        meta.maxUnitSize = resolutions[numResolutions - 1].unitSize;
        meta.maxUnitRatio = 1 / meta.maxUnitSize;
        scope.camera.bounds(lowestResolution.width, lowestResolution.height);
    },
    adaptResolution: function() {
        var scope = meta;
        var resolutions = scope.cache.resolutions;
        if (!resolutions) {
            return false;
        }
        var numResolutions = resolutions.length;
        if (numResolutions < 1) {
            return false;
        }
        var resolution;
        var newResolution = resolutions[0];
        var zoom = scope.camera.zoom;
        for (var i = numResolutions - 1; i >= 0; i--) {
            resolution = resolutions[i];
            if (zoom >= resolution.zoomThreshold) {
                newResolution = resolution;
                break;
            }
        }
        if (newResolution === scope.cache.currResolution) {
            return true;
        }
        scope.cache.currResolution = newResolution;
        scope.unitSize = newResolution.unitSize;
        scope.unitRatio = 1 / scope.unitSize;
        this.onAdapt.emit(newResolution, meta.Event.ADAPT);
        return true;
    },
    handleKeyDown: function(data, event) {
        switch (data.keyCode) {
          case Input.Key.TILDE:
            {
                meta.debug = !meta.cache.debug;
                meta.renderer.needRender = true;
            }
            break;
        }
    },
    onLoadingStart: function(data, event) {
        this.flags |= this.Flag.LOADING;
        var state;
        if (!this.preloaded) {
            state = "Preloading";
            meta.preloading.load();
        } else {
            state = "Loading";
            meta.loading.load();
        }
        if (meta.device.support.consoleCSS) {
            console.log("%c(" + state + " started)", "background: #eee; font-weight: bold;");
        } else {
            console.log("(" + state + " started)");
        }
    },
    onLoadingEnd: function(data, event) {
        this.flags &= ~this.Flag.LOADING;
        var state;
        if (!this.preloaded) {
            state = "Preloading";
            meta.preloading.unload();
        } else {
            state = "Loading";
            meta.loading.unload();
        }
        if (meta.device.support.consoleCSS) {
            console.log("%c(" + state + " ended)", "background: #eee; font-weight: bold;");
        } else {
            console.log("(" + state + " ended)");
        }
        if (!this.preloaded) {
            this._handleLoad();
        } else {
            this._handleReady();
        }
        meta.renderer.needRender = true;
    },
    onScriptLoadingEnd: function() {
        this._handlePreload();
    },
    updateLoading: function() {
        if (!this.loading && !this.scriptLoading) {
            this._ready();
        }
    },
    updateResolution: function() {
        this._resize(this.meta.cache.width, this.meta.cache.height);
    },
    resize: function(width, height) {
        var cache = this.meta.cache;
        cache.width = width || 0;
        cache.height = height || 0;
        this._resize(cache.width, cache.height);
    },
    _resize: function() {
        var width = this.meta.cache.width;
        var height = this.meta.cache.height;
        var containerWidth = 0;
        var containerHeight = 0;
        if (this._container === document.body) {
            containerWidth = window.innerWidth;
            containerHeight = window.innerHeight;
        } else {
            containerWidth = this.container.clientWidth;
            containerHeight = this.container.clientHeight;
        }
        if (width === 0) {
            width = containerWidth;
        }
        if (height === 0) {
            height = containerHeight;
        }
        if (this._adapt) {
            this.zoom = 1;
            var diffX = containerWidth - width;
            var diffY = containerHeight - height;
            if (diffX < diffY) {
                this.zoom = containerWidth / width;
            } else {
                this.zoom = containerHeight / height;
            }
            width *= this.zoom;
            height *= this.zoom;
        }
        width = Math.round(width);
        height = Math.round(height);
        if (this.width === width && this.height === height && !this._center) {
            return;
        }
        var ratio = 1;
        this.width = Math.ceil(width * ratio);
        this.height = Math.ceil(height * ratio);
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = width * this.scaleX + "px";
        this.canvas.style.height = height * this.scaleY + "px";
        if (this._center) {
            this.canvas.style.left = Math.floor((window.innerWidth - width) * .5) + "px";
            this.canvas.style.top = Math.floor((window.innerHeight - height) * .5) + "px";
        }
        if (this.ctx.imageSmoothingEnabled) {
            this.ctx.imageSmoothingEnabled = meta.cache.imageSmoothing;
        } else {
            this.ctx[meta.device.vendor + "ImageSmoothingEnabled"] = meta.cache.imageSmoothing;
        }
        this._updateOffset();
        this.onResize.emit(this, meta.Event.RESIZE);
        meta.renderer.needRender = true;
    },
    scale: function(scaleX, scaleY) {
        this.scaleX = scaleX || 1;
        this.scaleY = scaleY || this.scaleX;
        this._resize(this.meta.cache.width, this.meta.cache.height);
    },
    handleFocus: function(value) {
        if (this.focus === value) {
            return;
        }
        this.focus = value;
        if (this.enablePauseOnBlur) {
            this.pause = !value;
        }
        if (value) {
            this.onFocus.emit(value, meta.Event.FOCUS);
        } else {
            this.onBlur.emit(value, meta.Event.BLUR);
        }
    },
    handleVisibilityChange: function() {
        if (document[meta.device.hidden]) {
            this.handleFocus(false);
        } else {
            this.handleFocus(true);
        }
    },
    onFullScreenChangeCB: function() {
        var fullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        meta.device.fullscreen = !!fullscreen;
        this.onFullscreen.emit(meta.device.fullscreen, meta.Event.FULLSCREEN);
    },
    onCtxLost: function() {
        console.log("(Context lost)");
    },
    onCtxRestored: function() {
        console.log("(Context restored)");
    },
    _addMetaTags: function() {
        if (this.metaTagsAdded) {
            return;
        }
        var contentType = document.createElement("meta");
        contentType.setAttribute("http-equiv", "Content-Type");
        contentType.setAttribute("content", "text/html; charset=utf-8");
        document.head.appendChild(contentType);
        var encoding = document.createElement("meta");
        encoding.setAttribute("http-equiv", "encoding");
        encoding.setAttribute("content", "utf-8");
        document.head.appendChild(encoding);
        var content = "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height";
        var viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        viewport.setAttribute("content", content);
        document.head.appendChild(viewport);
        var appleMobileCapable = document.createElement("meta");
        appleMobileCapable.setAttribute("name", "apple-mobile-web-app-capable");
        appleMobileCapable.setAttribute("content", "yes");
        document.head.appendChild(appleMobileCapable);
        var appleStatusBar = document.createElement("meta");
        appleStatusBar.setAttribute("name", "apple-mobile-web-app-status-bar-style");
        appleStatusBar.setAttribute("content", "black-translucent");
        document.head.appendChild(appleStatusBar);
        this.metaTagsAdded = true;
    },
    _createRenderer: function() {
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("id", "meta-canvas");
        this.canvas.style.cssText = this.canvasStyle;
        var container = this.meta.cache.container;
        if (!container) {
            document.body.appendChild(this.canvas);
        } else {
            container.appendChild(this.canvas);
        }
        meta.renderer = new meta.CanvasRenderer();
    },
    _updateOffset: function() {
        this.offsetLeft = 0;
        this.offsetTop = 0;
        var element = this._container;
        if (element.offsetParent) {
            do {
                this.offsetLeft += element.offsetLeft;
                this.offsetTop += element.offsetTop;
            } while (element = element.offsetParent);
        }
        var rect = this._container.getBoundingClientRect();
        this.offsetLeft += rect.left;
        this.offsetTop += rect.top;
        rect = this.canvas.getBoundingClientRect();
        this.offsetLeft += rect.left;
        this.offsetTop += rect.top;
    },
    _printInfo: function() {
        if (meta.device.support.consoleCSS) {
            console.log("%c META2D v" + meta.version + " ", "background: #000; color: white; font-size: 12px; padding: 2px 0 1px 0;", "http://meta2d.com");
            console.log("%cBrowser: %c" + meta.device.name + " " + meta.device.version + "	", "font-weight: bold; padding: 2px 0 1px 0;", "padding: 2px 0 1px 0;");
            console.log("%cRenderer: %cCanvas ", "font-weight: bold; padding: 2px 0 2px 0;", "padding: 2px 0 2px 0;");
        } else {
            console.log("META2D v" + meta.version + " http://meta2d.com ");
            console.log("Browser: " + meta.device.name + " " + meta.device.version + "	");
            console.log("Renderer: Canvas ");
        }
    },
    fullscreen: function(value) {
        var device = meta.device;
        if (device.fullscreen === value) {
            return;
        }
        if (value) {
            if (!device.support.fullScreen) {
                console.warn("(meta.engine.fullscreen): Device does not support fullscreen mode");
                return;
            }
            console.log(device.fullScreenRequest);
            document.documentElement[device.fullScreenRequest](Element.ALLOW_KEYBOARD_INPUT);
        } else {
            console.log("exit");
            document[meta.device.fullScreenExit]();
        }
    },
    toggleFullscreen: function() {
        this.fullscreen(!meta.device.fullscreen);
    },
    set container(element) {
        if (this._container === element) {
            return;
        }
        if (this._container) {
            this._container.removeChild(this.canvas);
        }
        if (!element) {
            this._container = document.body;
        } else {
            this._container = element;
        }
        this._container.appendChild(this.canvas);
        this.updateResolution();
    },
    get container() {
        return this._container;
    },
    set imageSmoothing(value) {
        meta.cache.imageSmoothing = value;
        if (this.inited) {
            this.updateResolution();
        }
    },
    get imageSmoothing() {
        return meta.cache.imageSmoothing;
    },
    set cursor(value) {
        this._container.style.cursor = value;
    },
    get cursor() {
        return this._container.style.cursor;
    },
    set center(value) {
        this._center = value;
        this.updateResolution();
    },
    get center() {
        return this._center;
    },
    set adapt(value) {
        this._adapt = value;
        this.updateResolution();
    },
    get adapt() {
        return this._adapt;
    },
    get inited() {
        return (this.flags & this.Flag.INITED) === this.Flag.INITED;
    },
    get loading() {
        return (this.flags & this.Flag.LOADING) === this.Flag.LOADING;
    },
    get preloaded() {
        return (this.flags & this.Flag.PRELOADED) === this.Flag.PRELOADED;
    },
    get loaded() {
        return (this.flags & this.Flag.LOAED) === this.Flag.LOADED;
    },
    get ready() {
        return (this.flags & this.Flag.READY) === this.Flag.READY;
    },
    Flag: {
        LOADING: 1,
        INITED: 2,
        PRELOADED: 4,
        LOADED: 8,
        READY: 16
    },
    onUpdate: null,
    onResize: null,
    onBlur: null,
    onFocus: null,
    onFullscreen: null,
    onDebug: null,
    elementStyle: "padding:0; margin:0;",
    canvasStyle: "position:absolute; overflow:hidden; translateZ(0); " + "-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " + "-webkit-touch-callout: none; -webkit-user-select: none; zoom: 1;",
    meta: meta,
    time: meta.time,
    _container: null,
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    scaleX: 1,
    scaleY: 1,
    zoom: 1,
    ratio: 1,
    canvas: null,
    ctx: null,
    cb: null,
    autoInit: true,
    autoMetaTags: true,
    flags: 0,
    focus: false,
    pause: false,
    webgl: false,
    _center: false,
    _adapt: false,
    _updateLoop: null,
    _renderLoop: null,
    updateFuncs: [],
    renderFuncs: [],
    plugins: [],
    controllersReady: [],
    controllersUpdate: [],
    timers: [],
    timersRemove: [],
    fps: 0,
    _fpsCounter: 0,
    enablePauseOnBlur: true,
    enableAdaptive: true,
    unitSize: 1,
    unitRatio: 1,
    maxUnitSize: 1,
    maxUnitRatio: 1
};

"use strict";

meta.Device = function() {
    this.name = "unknown";
    this.version = "0";
    this.versionBuffer = null;
    this.vendors = [ "", "webkit", "moz", "ms", "o" ];
    this.vendor = "";
    this.support = {};
    this.audioFormats = [];
    this.mobile = false;
    this.isPortrait = false;
    this.audioAPI = false;
    this.hidden = null;
    this.visibilityChange = null;
    this.fullScreenRequest = null;
    this.fullScreenExit = null;
    this.fullScreenOnChange = null;
    this.fullscreen = false;
    this.load();
};

meta.Device.prototype = {
    load: function() {
        this.checkBrowser();
        this.mobile = this.isMobileAgent();
        this.checkConsoleCSS();
        this.checkFileAPI();
        this.support.onloadedmetadata = typeof window.onloadedmetadata === "object";
        this.support.onkeyup = typeof window.onkeyup === "object";
        this.support.onkeydown = typeof window.onkeydown === "object";
        this.support.canvas = this.isCanvasSupport();
        this.support.webgl = this.isWebGLSupport();
        this.modernize();
    },
    checkBrowser: function() {
        var regexps = {
            Chrome: [ /Chrome\/(\S+)/ ],
            Firefox: [ /Firefox\/(\S+)/ ],
            MSIE: [ /MSIE (\S+);/ ],
            Opera: [ /OPR\/(\S+)/, /Opera\/.*?Version\/(\S+)/, /Opera\/(\S+)/ ],
            Safari: [ /Version\/(\S+).*?Safari\// ]
        };
        var userAgent = navigator.userAgent;
        var name, currRegexp, match;
        var numElements = 2;
        for (name in regexps) {
            while (currRegexp = regexps[name].shift()) {
                if (match = userAgent.match(currRegexp)) {
                    this.version = match[1].match(new RegExp("[^.]+(?:.[^.]+){0," + --numElements + "}"))[0];
                    this.name = name;
                    this.versionBuffer = this.version.split(".");
                    var versionBufferLength = this.versionBuffer.length;
                    for (var i = 0; i < versionBufferLength; i++) {
                        this.versionBuffer[i] = parseInt(this.versionBuffer[i]);
                    }
                    break;
                }
            }
        }
        if (this.versionBuffer === null || this.name === "unknown") {
            console.warn("(meta.Device.checkBrowser) Could not detect browser.");
        } else {
            if (this.name === "Chrome" || this.name === "Safari" || this.name === "Opera") {
                this.vendor = "webkit";
            } else if (this.name === "Firefox") {
                this.vendor = "moz";
            } else if (this.name === "MSIE") {
                this.vendor = "ms";
            }
        }
    },
    checkConsoleCSS: function() {
        if (!this.mobile && (this.name === "Chrome" || this.name === "Opera")) {
            this.support.consoleCSS = true;
        } else {
            this.support.consoleCSS = false;
        }
    },
    checkFileAPI: function() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            this.support.fileAPI = true;
        } else {
            this.support.fileAPI = false;
        }
    },
    modernize: function() {
        if (!Number.MAX_SAFE_INTEGER) {
            Number.MAX_SAFE_INTEGER = 9007199254740991;
        }
        this.supportConsole();
        this.supportPageVisibility();
        this.supportFullScreen();
        this.supportRequestAnimFrame();
        this.supportPerformanceNow();
        this.supportAudioFormats();
        this.supportAudioAPI();
        this.supportFileSystemAPI();
    },
    isMobileAgent: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    isCanvasSupport: function() {
        return !!window.CanvasRenderingContext2D;
    },
    isWebGLSupport: function() {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!context;
    },
    supportConsole: function() {
        if (!window.console) {
            window.console = {};
            window.console.log = meta.emptyFuncParam;
            window.console.warn = meta.emptyFuncParam;
            window.console.error = meta.emptyFuncParam;
        }
    },
    supportPageVisibility: function() {
        if (document.hidden !== void 0) {
            this.hidden = "hidden";
            this.visibilityChange = "visibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "webkitHidden";
            this.visibilityChange = "webkitvisibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "mozhidden";
            this.visibilityChange = "mozvisibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "mshidden";
            this.visibilityChange = "msvisibilitychange";
        }
    },
    supportFullScreen: function() {
        this._fullScreenRequest();
        this._fullScreenExit();
        this._fullScreenOnChange();
        this.support.fullScreen = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
    },
    _fullScreenRequest: function() {
        var element = document.documentElement;
        if (element.requestFullscreen !== void 0) {
            this.fullScreenRequest = "requestFullscreen";
        } else if (element.webkitRequestFullscreen !== void 0) {
            this.fullScreenRequest = "webkitRequestFullscreen";
        } else if (element.mozRequestFullScreen !== void 0) {
            this.fullScreenRequest = "mozRequestFullScreen";
        } else if (element.msRequestFullscreen !== void 0) {
            this.fullScreenRequest = "msRequestFullscreen";
        }
    },
    _fullScreenExit: function() {
        if (document.exitFullscreen !== void 0) {
            this.fullScreenExit = "exitFullscreen";
        } else if (document.webkitExitFullscreen !== void 0) {
            this.fullScreenExit = "webkitExitFullscreen";
        } else if (document.mozCancelFullScreen !== void 0) {
            this.fullScreenExit = "mozCancelFullScreen";
        } else if (document.msExitFullscreen !== void 0) {
            this.fullScreenExit = "msExitFullscreen";
        }
    },
    _fullScreenOnChange: function() {
        if (document.onfullscreenchange !== void 0) {
            this.fullScreenOnChange = "fullscreenchange";
        } else if (document.onwebkitfullscreenchange !== void 0) {
            this.fullScreenOnChange = "webkitfullscreenchange";
        } else if (document.onmozfullscreenchange !== void 0) {
            this.fullScreenOnChange = "mozfullscreenchange";
        } else if (document.onmsfullscreenchange !== void 0) {
            this.fullScreenOnChange = "msfullscreenchange";
        }
    },
    supportRequestAnimFrame: function() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function() {
                return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
                    window.setTimeout(callback, 1e3 / 60);
                };
            }();
        }
    },
    supportPerformanceNow: function() {
        if (window.performance === void 0) {
            window.performance = {};
        }
        if (window.performance.now === void 0) {
            window.performance.now = Date.now;
        }
    },
    supportAudioFormats: function() {
        var audio = document.createElement("audio");
        if (audio.canPlayType("audio/mp4")) {
            this.audioFormats.push("m4a");
        }
        if (audio.canPlayType("audio/ogg")) {
            this.audioFormats.push("ogg");
        }
        if (audio.canPlayType("audio/mpeg")) {
            this.audioFormats.push("mp3");
        }
        if (audio.canPlayType("audio/wav")) {
            this.audioFormats.push("wav");
        }
    },
    supportAudioAPI: function() {
        if (!window.AudioContext) {
            window.AudioContext = window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
        }
        if (window.AudioContext) {
            this.audioAPI = true;
        }
    },
    supportFileSystemAPI: function() {
        if (!window.requestFileSystem) {
            window.requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.oRequestFileSystem || window.msRequestFileSystem;
        }
        if (window.requestFileSystem) {
            this.support.fileSystemAPI = true;
        }
    }
};

meta.device = new meta.Device();

"use strict";

if (meta.device.mobile) {
    window.onerror = function(message, file, lineNumber) {
        alert(file + ": " + lineNumber + " " + message);
    };
}

"use strict";

meta.emptyFunc = function() {};

meta.emptyFuncParam = function(param) {};

meta.loadTexture = function(buffer, folderPath, tag) {
    if (!meta._preloadResource("Texture", buffer, folderPath, tag)) {
        console.warn("(meta.preloadTexture) Unsupported parameter was passed.");
    }
};

meta.loadSound = function(buffer, folderPath, tag) {
    if (!meta._preloadResource("Sound", buffer, folderPath, tag)) {
        console.warn("(meta.loadSound) Unsupported parameter was passed.");
    }
};

meta.loadSpriteSheet = function(buffer, folderPath, tag) {
    if (!meta._preloadResource("SpriteSheet", buffer, folderPath, tag)) {
        console.warn("(meta.loadSpriteSheet) Unsupported parameter was passed.");
    }
};

meta.loadFont = function(buffer, folderPath, tag) {
    if (!meta._preloadResource("Font", buffer, folderPath, tag)) {
        console.warn("(meta.loadFont) Unsupported parameter was passed.");
    }
};

meta._preloadResource = function(strType, buffer, folderPath, tag) {
    if (folderPath) {
        var slashIndex = folderPath.lastIndexOf("/");
        if (slashIndex !== folderPath.length - 1) {
            folderPath += "/";
        }
    } else {
        folderPath = "";
    }
    if (buffer instanceof Array) {
        var numResources = buffer.length;
        for (var i = 0; i < numResources; i++) {
            meta._addResource(strType, buffer[i], folderPath, tag);
        }
    } else if (typeof buffer === "object" || typeof buffer === "string") {
        meta._addResource(strType, buffer, folderPath, tag);
    } else {
        return false;
    }
    return true;
};

meta._addResource = function(strType, data, folderPath, tag) {
    var resource;
    if (typeof data === "object") {
        if (data.path) {
            data.path = folderPath + data.path;
        }
        resource = new Resource[strType](data, tag);
    } else {
        resource = new Resource[strType](folderPath + data, tag);
    }
    return resource;
};

meta.loadFile = function(file, tag) {
    if (!(file instanceof File)) {
        console.warn("(meta.loadFile) Invalid file has been passed.");
    }
    var resource = new Resource.Texture(file, tag);
    return resource;
};

meta.onDomLoad = function(func) {
    if (document.readyState === "interactive" || document.readyState === "complete") {
        func();
        return;
    }
    var cbFunc = function(event) {
        func();
        window.removeEventListener("DOMContentLoaded", cbFunc);
    };
    window.addEventListener("DOMContentLoaded", cbFunc);
};

meta.enumToString = function(buffer, value) {
    if (buffer === void 0) {
        return "unknown";
    }
    for (var enumKey in buffer) {
        if (buffer[enumKey] === value) {
            return enumKey;
        }
    }
    return "unknown";
};

meta.hexToRgb = function(hex) {
    if (hex.length < 6) {
        hex += hex.substr(1, 4);
    }
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
};

meta.isUrl = function(str) {
    if (str.indexOf("http://") !== -1 || str.indexOf("https://") !== -1) {
        return true;
    }
    return false;
};

meta.toUpperFirstChar = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

meta.serialize = function(obj) {
    var str = [];
    for (var key in obj) {
        str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
    return str.join("&");
};

meta.info = function(text) {
    var msg = new Entity.Text(text);
    msg.anchor(.5);
    msg.pivot(.5);
    var texture = new Resource.SVG();
    texture.fillStyle = "black";
    texture.fillRect(0, 0, msg.width + 10, msg.height + 10);
    var holder = new Entity.Geometry(texture);
    holder.z = 999999;
    holder.pivot(.5);
    holder.anchor(.5, 0);
    holder.position(0, 20);
    holder.attach(msg);
    holder.static = true;
    meta.view.attach(holder);
};

meta.adaptTo = function(width, height, path) {
    if (meta.engine && meta.engine.isInited) {
        console.warn("[meta.adaptTo]:", "Only usable before engine is initialized.");
        return;
    }
    var resolutions = meta.cache.resolutions;
    if (!resolutions) {
        resolutions = [];
        meta.cache.resolutions = resolutions;
    }
    var lastChar = path.charAt(path.length - 1);
    if (lastChar !== "/") {
        path += "/";
    }
    var newRes = {
        width: width,
        height: height,
        path: path,
        unitSize: 1,
        zoomThreshold: 1
    };
    resolutions.push(newRes);
};

meta.removeFromArray = function(item, array) {
    var numItems = array.length;
    for (var i = 0; i < numItems; i++) {
        if (item === array[i]) {
            array[i] = array[numItems - 1];
            array.pop();
            break;
        }
    }
};

meta.shuffleArray = function(array) {
    var rand = meta.random;
    var length = array.length;
    var temp, item;
    while (length) {
        item = rand.number(0, --length);
        temp = array[length];
        array[length] = array[item];
        array[item] = temp;
    }
    return array;
};

meta.shuffleArrayRange = function(array, endRange, startRange) {
    var startRange = startRange || 0;
    var rand = meta.random;
    var temp, item;
    while (endRange > startRange) {
        item = rand.number(0, --endRange);
        temp = array[endRange];
        array[endRange] = array[item];
        array[item] = temp;
    }
    return array;
};

meta.rotateArray = function(array) {
    var tmp = array[0];
    var numItems = array.length - 1;
    for (var i = 0; i < numItems; i++) {
        array[i] = array[i + 1];
    }
    array[numItems] = tmp;
};

meta.nextPowerOfTwo = function(value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
};

meta.toHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

meta.rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

function isSpace(c) {
    return c === " " || c === "	" || c === "\r" || c === "\n";
}

function isNewline(c) {
    return c === "\r" || c === "\n";
}

function isDigit(c) {
    return c >= "0" && c <= "9" || c === ".";
}

function isAlpha(c) {
    return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c == "_" && c <= "$";
}

function isAlphaNum(c) {
    return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "_" || c === "$";
}

function isBinOp(c) {
    return c === "=" || c === "!" || c === "<" || c === ">" || c === "+" || c === "-" || c === "*" || c === "/" || c === "&" || c === "~" || c === "|" || c === "%";
}

function getClsFromPath(path) {
    var cls = null;
    var scope = window;
    var num = path.length;
    for (var i = 0; i < num; i++) {
        scope = scope[path[i]];
        if (!scope) {
            return null;
        }
    }
    return cls;
}

"use strict";

meta.Channel = function(name) {
    this.name = name;
    this.subs = [];
    this.numSubs = 0;
    this._emitting = false;
    this._subsToRemove = null;
};

meta.Channel.prototype = {
    emit: function(data, event) {
        this._emitting = true;
        var sub;
        for (var i = 0; i < this.numSubs; i++) {
            sub = this.subs[i];
            sub.func.call(sub.owner, data, event);
        }
        this._emitting = false;
        if (this._subsToRemove) {
            var numToRemove = this._subsToRemove.length;
            for (var n = 0; n < numToRemove; n++) {
                this.remove(this._subsToRemove[n]);
            }
            this._subsToRemove = null;
        }
    },
    add: function(func, owner, priority) {
        priority = priority || 0;
        if (!func) {
            console.warn("(meta.Channel.subscribe) No valid callback function passed.");
            return;
        }
        for (var i = 0; i < this.numSubs; i++) {
            if (this.subs[i].owner === owner) {
                console.warn("(meta.Channel.subscribe) Already subscribed to channel: " + this.name);
                return;
            }
        }
        var newSub = new meta.Subscriber(owner, func, priority);
        this.subs.push(newSub);
        this.numSubs++;
        if (priority) {
            this._havePriority = true;
            this.subs.sort(this._sortFunc);
        } else if (this._havePriority) {
            this.subs.sort(this._sortFunc);
        }
    },
    remove: function(owner) {
        if (owner === null || owner === void 0) {
            meta.channels[this.name] = null;
        } else {
            if (this._emitting) {
                if (!this._subsToRemove) {
                    this._subsToRemove = [];
                }
                this._subsToRemove.push(owner);
                return;
            }
            var sub;
            for (var i = 0; i < this.numSubs; i++) {
                sub = this.subs[i];
                if (sub.owner === owner) {
                    this.subs[i] = this.subs[this.numSubs - 1];
                    this.subs.pop();
                    this.numSubs--;
                    break;
                }
            }
            if (this._havePriority) {
                this.subs.sort(this._sortFunc);
            }
        }
    },
    removeAll: function() {
        this.subs = [];
        this.numSubs = 0;
    },
    _sortFunc: function(a, b) {
        return a.priority > b.priority ? -1 : 1;
    },
    _havePriority: false
};

meta.Subscriber = function(owner, func, priority) {
    this.owner = owner;
    this.func = func;
    this.priority = priority;
};

meta.createChannel = function(name) {
    if (!name) {
        console.warn("(meta.createChannel) No name was specified!");
        return null;
    }
    var channel = meta.channels[name];
    if (!channel) {
        channel = new meta.Channel(name);
        meta.channels[name] = channel;
    }
    return channel;
};

meta.releaseChannel = function(name) {
    if (!name) {
        console.warn("(meta.releaseChannel) No name was specified!");
        return;
    }
    if (meta.channels[name]) {
        meta.channels[name] = null;
    }
};

meta.subscribe = function(channel, func, owner, priority) {
    if (typeof owner !== "object") {
        console.warn("(meta.subscribe) No owner passed.");
        return;
    }
    if (!func) {
        console.warn("(meta.subscribe) No callback function passed.");
        return;
    }
    if (typeof channel === "string") {
        var srcChannel = meta.channels[channel];
        if (!srcChannel) {
            channel = meta.createChannel(channel);
            if (!channel) {
                return;
            }
        } else {
            channel = srcChannel;
        }
    } else if (Object.prototype.toString.call(channel) === "[object Array]") {
        var numChannels = channel.length;
        for (var i = 0; i < numChannels; i++) {
            meta.subscribe(channel[i], func, owner, priority);
        }
        return;
    } else {
        console.warn("(meta.subscribe) Wrong type for channel object: " + typeof channel);
        return;
    }
    channel.add(func, owner, priority);
};

meta.unsubscribe = function(channel, owner) {
    if (typeof channel === "string") {
        channel = meta.channels[channel];
        if (!channel) {
            console.warn("(meta.unsubscribe) No name was specified!");
            return;
        }
    } else if (Object.prototype.toString.call(channel) === "[object Array]") {
        var numChannels = channel.length;
        for (var i = 0; i < numChannels; i++) {
            meta.unsubscribe(channel[i], owner);
        }
        return;
    } else {
        console.warn("(meta.unsubscribe) Wrong type for channel object.");
        return;
    }
    channel.remove(owner);
};

meta.emit = function(channel, data, event) {
    if (typeof channel === "string") {
        channel = meta.channels[channel];
        if (!channel) {
            console.warn("(meta.emit) No name was specified!");
            return;
        }
    }
    channel.emit(data, event);
};

"use strict";

meta.View = function(name) {
    this.name = name;
    this.entities = [];
    this.children = null;
    this.parent = null;
    this.flags = 0;
};

meta.View.prototype = {
    remove: function() {
        if (this.name === "master") {
            console.warn("(meta.View.remove) Master view can't be removed");
            return;
        }
        if (this.parent) {
            this.parent.detachView(this);
        }
        var num = this.entities.length;
        for (var n = 0; n < num; n++) {
            this.entities[n].remove();
        }
        this.entities.length = 0;
        if (this.children) {
            num = this.children.length;
            for (n = 0; n < num; n++) {
                this.children[n].remove();
            }
        }
    },
    attach: function(entity) {
        if (!(entity instanceof Entity.Geometry)) {
            console.warn("(meta.View.attach) Trying to add invalid entity");
            return;
        }
        if (entity.flags & this.Flag.REMOVED) {
            console.warn("(meta.View.attach) Trying to add entity that has been marked as removed");
            return;
        }
        if (entity._view) {
            if (entity._view === this) {
                console.warn("(meta.View.attach) Entity is already added to this view");
            } else {
                console.warn("(meta.View.attach) Entity is already added to some other view");
            }
            return;
        }
        entity.flags |= entity.Flag.ROOT;
        entity._view = this;
        if (this._x !== 0 || this._y !== 0) {
            entity.updatePos();
        }
        if (this._z !== 0) {
            entity.updateZ();
        }
        if (this.flags & this.Flag.STATIC) {
            entity.static = true;
        }
        this.entities.push(entity);
        this._attachChildren(entity.children);
        if (this.flags & this.Flag.ACTIVE && !(this.flags & this.Flag.INSTANCE_HIDDEN)) {
            meta.renderer.addEntity(entity, false);
        }
    },
    _attachChildren: function(children) {
        if (!children) {
            return;
        }
        var child;
        var numChildren = children.length;
        for (var i = 0; i < numChildren; i++) {
            child = children[i];
            if (child.removed) {
                continue;
            }
            child._view = this;
            this._attachChildren(child.children);
        }
    },
    detach: function(entity) {
        if (entity.flags & this.Flag.REMOVED) {
            return;
        }
        if (!entity._view) {
            console.warn("(meta.View.detach) Entity does not have view.");
            return;
        }
        if (entity._view !== this) {
            console.warn("(meta.View.detach) Entity is part of other view: " + entity._view.name);
            return;
        }
        if (!(entity.parent.flags & entity.Flag.RENDER_HOLDER)) {
            console.warn("(meta.View.detach) Entity is part of other view: " + entity._view.name);
            return;
        }
        entity &= ~entity.Flag.ROOT;
        entity._view = null;
        var num = this.entities.length;
        for (var n = 0; n < num; n++) {
            if (this.entities[n] === entity) {
                this.entities[n] = this.entities[num - 1];
                this.entities.pop();
                break;
            }
        }
        if (this.flags & this.Flag.ACTIVE && !(this.flags & this.Flag.INSTANCE_HIDDEN)) {
            meta.renderer.removeEntity(entity);
        }
    },
    attachView: function(view) {
        if (!view) {
            if (this.parent) {
                console.warn("(meta.View.attach) No view was passed.");
                return;
            }
            meta.cache.view.attachView(this);
            return;
        }
        if (typeof view === "string") {
            var srcView = meta.cache.views[view];
            if (!srcView) {
                console.warn("(meta.View.attach) No such view found: " + view);
                return;
            }
            view = srcView;
        } else if (!(view instanceof meta.View)) {
            console.warn("(meta.View.attach) Trying to attach invalid view object.");
            return;
        }
        if (view.parent) {
            console.warn("(meta.View.attach) View is already part of other view.");
            return;
        }
        if (!this.children) {
            this.children = [ view ];
        } else {
            this.children.push(view);
        }
        view.parent = this;
        if (this.flags & this.Flag.ACTIVE) {
            view._activate();
        }
    },
    detachView: function(view) {
        if (!view) {
            if (!this.parent) {
                console.warn("(meta.View.detachView) No view was been passed.");
                return;
            }
            this.parent.detachView(this);
            return;
        }
        if (typeof view === "string") {
            var srcView = meta.cache.views[view];
            if (!srcView) {
                console.warn('(meta.View.detachView) No such view found: "' + view + '"');
                return;
            }
            view = srcView;
        }
        if (!view.parent) {
            console.warn("(meta.View.detachView) View has not parents to detach from");
            return;
        }
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                if (this.children[i] === view) {
                    this.children[i] = this.children[numChildren - 1];
                    this.children.pop();
                    break;
                }
            }
        }
        view.parent = null;
        if (this.flags & this.Flag.ACTIVE) {
            view._deactivate();
        }
    },
    detachViews: function() {
        var child;
        var numChildren = this.children.length;
        for (var n = 0; n < numChildren; n++) {
            child = this.children[n];
            child.detachView(child);
        }
    },
    _activate: function() {
        this.flags |= this.Flag.ACTIVE;
        if (this.flags & this.Flag.INSTANCE_HIDDEN) {
            return;
        }
        meta.renderer.addEntities(this.entities);
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._activate();
            }
        }
    },
    _deactivate: function() {
        this.flags &= ~this.Flag.ACTIVE;
        if (this.flags & this.Flag.INSTANCE_HIDDEN) {
            return;
        }
        meta.renderer.removeEntities(this.entities);
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._deactivate();
            }
        }
    },
    _updateHidden: function() {
        if (this.flags & this.Flag.INSTANCE_HIDDEN) {
            if (this.flags & this.Flag.HIDDEN) {
                return;
            }
            if (this.parent.flags & this.Flag.INSTANCE_HIDDEN) {
                return;
            }
            this.flags &= ~this.Flag.INSTANCE_HIDDEN;
            if (this.flags & this.Flag.ACTIVE) {
                meta.renderer.removeEntities(this.entities);
            }
        } else {
            if (this.flags & this.Flag.HIDDEN || this.parent.flags & this.Flag.INSTANCE_HIDDEN) {
                this.flags |= this.Flag.INSTANCE_HIDDEN;
                if (this.flags & this.Flag.ACTIVE) {
                    meta.renderer.addEntities(this.entities);
                }
            } else {
                return;
            }
        }
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._updateHidden();
            }
        }
    },
    set hidden(value) {
        if (value) {
            this.flags |= this.Flag.HIDDEN;
        } else {
            this.flags &= ~this.Flag.HIDDEN;
        }
        this._updateHidden();
    },
    get hidden() {
        return (this.flags & this.Flag.HIDDEN) === this.Flag.HIDDEN;
    },
    updateEntity: function(entity) {
        if ((this.flags & this.Flag.ACTIVE) === 0) {
            return;
        }
        if (this.flags & this.Flag.INSTANCE_HIDDEN) {
            return;
        }
        if (entity.flags & entity.Flag.INSTANCE_ENABLED) {
            meta.renderer.addEntity(entity);
        } else {
            meta.renderer.removeEntity(entity);
        }
    },
    set x(value) {
        if (this._x === value) {
            return;
        }
        this._x = value;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.entities[i].updatePos();
        }
    },
    set y(value) {
        if (this._y === value) {
            return;
        }
        this._y = value;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.entities[i].updatePos();
        }
    },
    set z(value) {
        this._z = value;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.entities[i].updateZ();
        }
    },
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    get z() {
        return this._z;
    },
    get tween() {
        if (!this._tween) {
            this._tween = new meta.Tween(this);
        }
        return this._tween;
    },
    set static(value) {
        if (value) {
            if (this.flags & this.Flag.STATIC) {
                return;
            }
            this.flags |= this.Flag.STATIC;
            this._updateStatic(true);
        } else {
            if ((this.flags & this.Flag.STATIC) === 0) {
                return;
            }
            this.flags &= ~this.Flag.STATIC;
            this._updateStatic(false);
        }
    },
    get static() {
        return (this.flags & this.Flag.STATIC) === this.Flag.STATIC;
    },
    _updateStatic: function(value) {
        var entity;
        var numEntities = this.entities.length;
        for (var n = 0; n < numEntities; n++) {
            entity = this.entities[n];
            entity.flags |= entity.Flag.STATIC;
        }
    },
    Flag: {
        HIDDEN: 1 << 0,
        INSTANCE_HIDDEN: 1 << 1,
        ACTIVE: 1 << 2,
        STATIC: 1 << 3
    },
    _x: 0,
    _y: 0,
    _z: 0,
    _tween: null,
    "debugger": false,
    entitiesUI: null
};

meta.createView = function(name) {
    if (!name || typeof name !== "string") {
        console.error("(meta.createView) Invalid name of the view");
        return;
    }
    var view = meta.cache.views[name];
    if (view) {
        console.error("(meta.createView) View with a name - " + name + ", already exist");
        return;
    }
    view = new meta.View(name);
    meta.cache.views[name] = view;
    return view;
};

meta.setView = function(view) {
    if (!view) {
        console.error("(meta.setView) No view passed");
        return;
    }
    var cache = meta.cache;
    if (typeof view === "string") {
        var name = view;
        view = cache.views[name];
        if (!view) {
            console.warn("(meta.setView) Creating an empty view, could be unintended - " + name);
            view = new meta.View(name);
            cache.views[name] = view;
        }
    }
    var masterView = cache.view;
    if (view === masterView) {
        console.warn("(meta.setView) Cannot modify master view");
        return;
    }
    if (view.parentView) {
        console.warn("(meta.setView) View is already attached to master or other view");
        return;
    }
    cache.view.detachViews();
    cache.view.attachView(view);
};

meta.getView = function(name) {
    if (!name) {
        console.error("(meta.getView) No name specified");
        return null;
    }
    var view = meta.cache.views[name];
    if (!view) {
        view = new meta.View(name);
        meta.cache.views[name] = view;
    }
    return view;
};

meta.attachView = function(view) {
    var cache = meta.cache;
    if (typeof view === "string") {
        var srcView = cache.views[view];
        if (!srcView) {
            console.warn("(meta.attachView) No such view found: " + view);
            return;
        }
        view = srcView;
    }
    if (view.parentView) {
        console.warn("(meta.attachView) View already has parent attached");
        return;
    }
    cache.view.attachView(view);
};

meta.detachView = function(view) {
    var cache = meta.cache;
    if (typeof view === "string") {
        var srcView = cache.views[view];
        if (!view) {
            console.warn("(meta.detachView) No such view found: " + view);
            return;
        }
        view = srcView;
    }
    if (!view.parentView) {
        console.warn("(meta.detachView) View does not have parent attached");
        return;
    }
    cache.view.detachView(view);
};

Object.defineProperty(meta, "view", {
    set: function(view) {
        meta.setView(view);
    },
    get: function() {
        return meta.cache.view;
    }
});

"use strict";

meta.Camera = function() {
    this.volume = new meta.math.AABBext(0, 0, 0, 0);
    this.zoomBounds = null;
    this._wasResized = false;
    this._autoZoom = false;
    this._zoom = 1;
    this.prevZoom = 1;
    this.zoomRatio = 1;
    this._draggable = false;
    this._dragging = false;
    this._moved = false;
    this._center = false;
    this._centerX = true;
    this._centerY = true;
    this._worldBounds = false;
    this._followEntity = null;
    this.onResize = meta.createChannel(meta.Event.CAMERA_RESIZE);
    this.onMove = meta.createChannel(meta.Event.CAMERA_MOVE);
    this.init();
};

meta.Camera.prototype = {
    init: function() {
        meta.engine.onResize.add(this._onResize, this);
        meta.subscribe(meta.Event.WORLD_RESIZE, this._onWorldResize, this);
        this.zoomBounds = {
            width: -1,
            height: -1,
            minWidth: -1,
            minHeight: -1,
            maxWidth: -1,
            maxHeight: -1
        };
    },
    release: function() {
        this.onMove.release();
        meta.engine.onResize.remove(this);
        meta.world.onResize.remove(this);
    },
    update: function(tDelta) {
        if (!this._followEntity) {
            return;
        }
        var entityVolume = this._followEntity.volume;
        var cameraX = Math.floor(entityVolume.x) - Math.floor(this.volume.width / 2);
        var cameraY = Math.floor(entityVolume.y) - Math.floor(this.volume.height / 2);
        this.position(cameraX, cameraY);
    },
    updateView: function() {
        if (this._autoZoom) {
            this.updateAutoZoom();
        } else {
            this.updateZoom();
        }
        var world = meta.world;
        if (!this._moved) {
            var moveX = 0;
            var moveY = 0;
            if (this._center) {
                if (this._centerX) {
                    moveX = Math.floor((this.volume.width - world.width) / 2);
                } else {
                    moveX = 0;
                }
                if (this._centerY) {
                    moveY = Math.floor((this.volume.height - world.height) / 2);
                } else {
                    moveY = 0;
                }
            } else {
                moveX = 0;
                moveY = 0;
            }
            this.volume.move(moveX, moveY);
        }
        if (this._wasResized) {
            this.onResize.emit(this, meta.Event.CAMERA_RESIZE);
            this._wasResized = false;
        }
        this.onMove.emit(this, meta.Event.CAMERA_MOVE);
    },
    updateZoom: function() {
        if (this.prevZoom !== this._zoom) {
            this.zoomRatio = 1 / this._zoom;
            this.volume.scale(this.zoomRatio, this.zoomRatio);
            this._wasResized = true;
        }
    },
    updateAutoZoom: function() {
        var engine = meta.engine;
        var width = this.zoomBounds.width;
        var height = this.zoomBounds.height;
        var diffX = engine.width / width;
        var diffY = engine.height / height;
        this.prevZoom = this._zoom;
        this._zoom = diffX;
        if (diffY < diffX) {
            this._zoom = diffY;
        }
        if (engine.adaptResolution()) {
            width = this.zoomBounds.width;
            height = this.zoomBounds.height;
            diffX = engine.width / width;
            diffY = engine.height / height;
            this._zoom = diffX;
            if (diffY < diffX) {
                this._zoom = diffY;
            }
            this.volume.resize(engine.width, engine.height);
        }
        this.updateZoom();
    },
    bounds: function(width, height) {
        this._autoZoom = true;
        this._wasResized = true;
        this.zoomBounds.width = width;
        this.zoomBounds.height = height;
        if (this.volume.width !== 0 || this.volume.height !== 0) {
            this.updateView();
        }
    },
    minBounds: function(width, height) {
        this._autoZoom = true;
        this._wasResized = true;
        this.zoomBounds.minWidth = width;
        this.zoomBounds.minHeight = height;
        this.updateView();
    },
    maxBounds: function(width, height) {
        this._autoZoom = true;
        this._wasResized = true;
        this.zoomBounds.maxWidth = width;
        this.zoomBounds.maxHeight = height;
        this.updateView();
    },
    _onInput: function(data, event) {
        var inputEvent = Input.Event;
        if (event === inputEvent.MOVE) {
            this._drag(data);
        } else if (event === inputEvent.DOWN) {
            if (data.keyCode === Input.Key.BUTTON_LEFT) {
                this._startDrag(data);
            }
        } else if (event === inputEvent.UP) {
            if (data.keyCode === Input.Key.BUTTON_LEFT) {
                this._endDrag(data);
            }
        }
    },
    _onResize: function(data, event) {
        this.volume.resize(data.width, data.height);
        this._prevZoom = this._zoom;
        this._zoom = meta.engine.zoom;
        this._wasResized = true;
        this.updateView();
    },
    _onWorldResize: function(data, event) {
        this.updateView();
    },
    _startDrag: function(data) {
        if (!this._draggable) {
            return;
        }
        this._dragging = true;
    },
    _endDrag: function(data) {
        this._dragging = false;
    },
    _drag: function(data) {
        if (!this._dragging) {
            return;
        }
        var scope = meta;
        var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
        var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;
        this._moved = true;
        if (this._worldBounds) {
            var worldVolume = scope.world.volume;
            var newX = this.volume.minX - diffX;
            var newY = this.volume.minY - diffY;
            if (newX < worldVolume.minX) {
                diffX -= worldVolume.minX - newX;
            } else if (newX + this.volume.width > worldVolume.maxX) {
                diffX = this.volume.maxX - worldVolume.maxX;
            }
            if (newY < worldVolume.minY) {
                diffY -= worldVolume.minY - newY;
            } else if (newY + this.volume.height > worldVolume.maxY) {
                diffY = this.volume.maxY - worldVolume.maxY;
            }
        }
        this.volume.move(-diffX, -diffY);
        this.onMove.emit(this, scope.Event.CAMERA_MOVE);
    },
    position: function(x, y) {
        if (this.volume.x === x && this.volume.y === y) {
            return;
        }
        this.volume.position(x, y);
        this._moved = true;
        this.updateView();
    },
    follow: function(entity) {
        if (!(entity instanceof Entity.Geometry)) {
            console.warn("(meta.Camera.follow): Invalid entity - should be part of Entity.Geometry");
            return;
        }
        this._followEntity = entity;
    },
    set x(value) {
        if (this.volume.x === value) {
            return;
        }
        this.volume.position(value, this.volume.y);
        this._moved = true;
        this.updateView();
    },
    set y(value) {
        if (this.volume.y === value) {
            return;
        }
        this.volume.position(this.volume.x, value);
        this._moved = true;
        this.updateView();
    },
    get x() {
        return this.volume.x;
    },
    get y() {
        return this.volume.y;
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    },
    set zoom(value) {
        if (this._zoom === value) {
            return;
        }
        this.prevZoom = this._zoom;
        this._zoom = value;
        this.updateView();
    },
    get zoom() {
        return this._zoom;
    },
    set enableBorderIgnore(value) {
        this._enableBorderIgnore = value;
        this.updateView();
    },
    get enableBorderIgnore() {
        return this._enableBorderIgnore;
    },
    set draggable(value) {
        if (this._draggable === value) {
            return;
        }
        this._draggable = value;
        var events = [ Input.Event.DOWN, Input.Event.UP, Input.Event.MOVE ];
        if (value) {
            meta.subscribe(events, this._onInput, this);
        } else {
            meta.unsubscribe(events, this);
            this._dragging = false;
        }
    },
    get draggable() {
        return this._draggable;
    },
    set autoZoom(value) {
        if (this._autoZoom === value) {
            return;
        }
        this._autoZoom = value;
        this._wasResized = true;
        this.updateView();
    },
    get autoZoom() {
        return this._autoZoom;
    },
    set worldBounds(value) {
        if (this._worldBounds === value) {
            return;
        }
        this._worldBounds = value;
        this._wasResized = true;
        this.updateView();
    },
    get worldBounds() {
        return this._worldBounds;
    },
    set center(value) {
        this._center = value;
        this.updateView();
    },
    set centerX(value) {
        this._centerX = value;
        this.updateView();
    },
    set centerY(value) {
        this._centerY = value;
        this.updateView();
    },
    get center() {
        return this._center;
    },
    get centerX() {
        return this._centerX;
    },
    get centerY() {
        return this._centerY;
    }
};

"use strict";

meta.class("meta.World", {
    init: function(width, height) {
        this.volume = new meta.math.AABB(0, 0, 0, 0);
        this.volumes = [ this.volume ];
        this.onResize = meta.createChannel(meta.Event.WORLD_RESIZE);
        meta.camera.onResize.add(this._updateBounds, this);
    },
    bounds: function(minX, minY, maxX, maxY) {
        this.volume.set(minX, minY, maxX - minX, maxY - minY);
        this.centerX = minX + (maxX - minX) / 2;
        this.centerY = minY + (maxY - minY) / 2;
        this._adapt = false;
    },
    _updateBounds: function(camera, event) {
        if (!this._adapt) {
            return;
        }
        this.volume.set(0, 0, Math.ceil(camera.width), Math.ceil(camera.height));
        this.centerX = camera.width / 2;
        this.centerY = camera.height / 2;
    },
    removeVolume: function(volume) {
        var num = this.volumes.length;
        for (var i = 0; i < num; i++) {
            if (this.volumes[i] === volume) {
                this.volumes[i] = this.volumes[num - 1];
                this.volumes.pop();
                break;
            }
        }
    },
    get randX() {
        return meta.random.number(this.volume.minX, this.volume.maxX);
    },
    get randY() {
        return meta.random.number(this.volume.minY, this.volume.maxY);
    },
    set adapt(value) {
        this._adapt = value;
        if (value) {
            this._updateBounds(meta.camera, 0);
        }
    },
    get adapt() {
        return this._adapt;
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    },
    onResize: null,
    volume: null,
    centerX: 0,
    centerY: 0,
    volumes: null,
    _adapt: true,
    _screenBounds: true
});

"use strict";

meta.class("meta.Controller", {
    init: function() {
        this.view = meta.createView("__ctrl__" + meta.cache.ctrlUniqueID++);
        if (this.onInit) {
            this.onInit();
        }
    },
    onInit: null,
    load: function() {
        if (this.flags & this.Flag.LOADED) {
            return;
        }
        if (this.onTryLoad) {
            if (!this.onTryLoad()) {
                return;
            }
        }
        this.forceLoad();
    },
    forceLoad: function() {
        if (this.flags & this.Flag.LOADED) {
            return;
        }
        if ((this.flags & this.Flag.FIRST_LOADED) === 0) {
            if (this.onFirstLoad) {
                this.onFirstLoad();
            }
            this.flags |= this.Flag.FIRST_LOADED;
        }
        if (this.onLoad) {
            this.onLoad();
        }
        meta.engine.controllersReady.push(this);
        meta.cache.view.attachView(this.view);
        this.flags |= this.Flag.LOADED;
    },
    unload: function() {
        if ((this.flags & this.Flag.LOADED) === 0) {
            return;
        }
        if (this.onTryUnload) {
            if (!this.onTryUnload()) {
                return;
            }
        }
        this.forceUnload();
    },
    forceUnload: function() {
        if ((this.flags & this.Flag.LOADED) === 0) {
            return;
        }
        if (this.onUnload) {
            this.onUnload();
        }
        if (this.onUpdate) {
            var buffer = meta.engine.controllersUpdate;
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                if (buffer[n] === this) {
                    buffer.splice(n, 1);
                    break;
                }
            }
        }
        meta.cache.view.detachView(this.view);
        this.flags &= ~(this.Flag.LOADED | this.Flag.READY);
    },
    onTryLoad: null,
    onFirstLoad: null,
    onLoad: null,
    onTryUnload: null,
    onUnload: null,
    onFirstReady: null,
    onReady: null,
    ready: function() {
        if (this.flags & this.Flag.READY) {
            return;
        }
        if ((this.flags & this.Flag.FIRST_READY) === 0) {
            if (this.onFirstReady) {
                this.onFirstReady();
            }
            this.flags |= this.Flag.FIRST_READY;
        }
        if (this.onReady) {
            this.onReady();
        }
        if (this.onUpdate) {
            meta.engine.controllersUpdate.push(this);
        }
        this.flags |= this.Flag.READY;
    },
    onUpdate: null,
    Flag: {
        LOADED: 1,
        READY: 2,
        FIRST_LOADED: 4,
        FIRST_READY: 8
    },
    name: "",
    view: null,
    flags: 0
});

function _addClassInstance(cls) {
    var path = cls.prototype.__name__.split(".").slice(2);
    var num = path.length - 1;
    if (cls instanceof meta.Controller) {
        console.error("(meta.controller): Controller parent class should be meta.Controller");
        return;
    }
    var name;
    var scope = window;
    var prevScope = scope;
    for (var n = 0; n < num; n++) {
        name = path[n];
        scope = prevScope[name];
        if (!scope) {
            scope = {};
            prevScope[name] = scope;
        }
        prevScope = scope;
    }
    var name = path[num];
    if (scope[name]) {
        console.error("(meta.controller): Scope is already in use: " + path.join("."));
        return;
    }
    cls.prototype.name = name;
    if (meta.engine.inited) {
        scope[name] = new cls();
    } else {
        if (!meta.cache.ctrlsToCreate) {
            meta.cache.ctrlsToCreate = [ {
                cls: cls,
                scope: scope
            } ];
        } else {
            meta.cache.ctrlsToCreate.push({
                cls: cls,
                scope: scope
            });
        }
    }
}

meta.controllers = {};

meta.cache.ctrlUniqueID = 0;

meta.controller = function(name, extend, obj) {
    if (!obj) {
        if (typeof extend === "object") {
            obj = extend;
            extend = "meta.Controller";
        } else {
            obj = null;
        }
    }
    if (!extend) {
        extend = "meta.Controller";
    }
    meta.class("meta.controllers." + name, extend, obj, _addClassInstance);
};

meta.class("meta.Component", {
    owner: null
});

meta.component = function(name, extend, obj) {
    meta.class(name, extend, obj);
};

"use strict";

meta.Timer = function(owner, func, tDelta, numTimes) {
    this.owner = owner;
    this.id = meta.cache.timerIndex++;
    this.func = func;
    this.onRemove = null;
    this.tDelta = tDelta;
    this.numTimes = numTimes;
    if (this.numTimes === void 0) {
        this.numTimes = -1;
    }
    this.initNumTimes = this.numTimes;
    this.tAccumulator = 0;
    this.tStart = Date.now();
    this.__index = -1;
};

meta.Timer.prototype = {
    play: function() {
        if (this.__index !== -1) {
            return;
        }
        this.__index = meta.engine.timers.push(this) - 1;
    },
    stop: function() {
        if (this.__index === -1) {
            return;
        }
        meta.engine.timersRemove.push(this);
        this.__index = -1;
    },
    pause: function() {
        this.paused = true;
    },
    resume: function() {
        this.paused = false;
        this.tStart = Date.now();
    },
    reset: function() {
        this.tAccumulator = 0;
        this.numTimes = this.initNumTimes;
        this.paused = false;
        this.play();
    },
    onRemove: null,
    paused: false
};

meta.createTimer = function(owner, func, tDelta, numTimes) {
    if (typeof owner === "function") {
        numTimes = tDelta;
        tDelta = func;
        func = owner;
        owner = window;
    }
    if (!func) {
        console.warn("(meta.addTimer) Invalid function passed");
        return;
    }
    var newTimer = new meta.Timer(owner, func, tDelta, numTimes);
    return newTimer;
};

meta.addTimer = function(owner, func, tDelta, numTimes) {
    var newTimer = meta.createTimer(owner, func, tDelta, numTimes);
    newTimer.play();
    return newTimer;
};

"use strict";

meta.Event = {
    UPDATE: "update",
    RESIZE: "resize",
    WORLD_RESIZE: "world-resize",
    CAMERA_MOVE: "camera-move",
    CAMERA_RESIZE: "camera-resize",
    BLUR: "blur",
    FOCUS: "focus",
    FULLSCREEN: "fullscreen",
    ADAPT: "adapt",
    DEBUG: "debug",
    RENDER_DEBUG: "debug-draw"
};

meta.Priority = {
    LOW: 0,
    MEDIUM: 5e3,
    HIGH: 1e4
};

meta.Cursor = {
    ALIAS: "alias",
    ALL_SCROLL: "all-scroll",
    CELL: "cell",
    CONTEXT_MENU: "context-menu",
    COL_RESIZE: "col-resize",
    COPY: "copy",
    CROSSHAIR: "crosshair",
    DEFAULT: "default",
    E_RESIZE: "e-resize",
    EW_RESIZE: "ew-resize",
    GRAB: "grab",
    GRABBING: "grabbing",
    HELP: "help",
    MOVE: "move",
    N_RESIZE: "n-resize",
    NE_RESIZE: "ne-resize",
    NESW_RESIZE: "nesw-resize",
    NS_RESIZE: "ns-reisize",
    NW_RESIZE: "nw-resize",
    NWSE_RESIZE: "nwse-resize",
    NO_DROP: "no-drop",
    NONE: "none",
    NOT_ALLOWED: "not-allowed",
    POINTER: "pointer",
    PROGRESS: "progress",
    ROW_RESIZE: "row-resize",
    S_RESIZE: "s-resize",
    SE_RESIZE: "se-resize",
    SW_RESIZE: "sw-resize",
    TEXT: "text",
    VERTICAL_TEXT: "vertical-text",
    W_RESIZE: "w-resize",
    WAIT: "wait",
    ZOOM_IN: "zoom-in",
    ZOOM_OUT: "zoom-out",
    INITIAL: "initial"
};

"use strict";

"use strict";

meta.ajax = function(params) {
    var data = meta.serialize(params.data);
    var xhr = new XMLHttpRequest();
    if (params.dataType === "html") {
        params.responseType = "document";
    } else if (params.dataType === "script" || params.dataType === "json") {
        params.responseType = "text";
    } else if (params.dataType === void 0) {
        params.responseType = "GET";
        xhr.overrideMimeType("text/plain");
    } else {
        params.responseType = params.dataType;
    }
    if (params.type === void 0) {
        params.type = "GET";
    }
    xhr.open(params.type, params.url, true);
    xhr.onload = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (params.success !== void 0) {
                if (params.responseType === "document") {
                    params.success(xhr.responseXML);
                } else if (params.dataType === "script") {
                    params.success(eval(xhr.responseText));
                } else if (params.dataType === "json") {
                    params.success(JSON.parse(xhr.responseText));
                } else {
                    params.success(xhr.responseText);
                }
            }
        } else {
            if (params.error !== void 0) {
                params.error();
            }
        }
    };
    xhr.send(data);
    return xhr;
};

"use strict";

meta.Tokenizer = function() {
    this.currChar = 0;
    this.buffer = null;
    this.bufferLength = 0;
    this.cursor = 0;
    this.token = {
        type: 0,
        str: "",
        value: 0,
        line: 0
    };
};

meta.Tokenizer.prototype = {
    setup: function(data) {
        this.buffer = data;
        this.bufferLength = data.length;
        this.cursor = 0;
    },
    nextToken: function() {
        this.token.type = 0;
        this.token.str = "";
        this.token.value = 0;
        this.nextChar();
        while (isSpace(this.currChar)) {
            this.nextChar();
        }
        if (isAlpha(this.currChar)) {
            this.token.str += this.currChar;
            this.nextChar();
            while (isAlphaNum(this.currChar)) {
                this.token.str += this.currChar;
                this.nextChar();
            }
            this.cursor--;
            switch (this.token.str) {
              case "true":
                this.token.type = this.Type.BOOL;
                this.token.value = 1;
                break;

              case "false":
                this.token.type = this.Type.BOOL;
                break;

              case "NaN":
                this.token.type = this.Type.NUMBER;
                this.token.value = NaN;
                break;

              default:
                this.token.type = this.Type.NAME;
                break;
            }
            return this.token;
        }
        if (isDigit(this.currChar)) {
            this.token.str += this.currChar;
            this.nextChar();
            while (isDigit(this.currChar)) {
                this.token.str += this.currChar;
                this.nextChar();
            }
            this.cursor--;
            if (this.token.str === ".") {
                this.token.type = this.Type.SYMBOL;
                this.token.value = this.token.str;
                return this.token;
            }
            this.token.type = this.Type.NUMBER;
            this.token.value = parseFloat(this.token.str);
            return this.token;
        }
        if (isBinOp(this.currChar)) {
            this.token.str = this.currChar;
            this.token.type = this.Type.BINOP;
            return this.token;
        }
        if (this.currChar === '"' || this.currChar === "'") {
            var endChar = this.currChar;
            this.nextChar();
            var peekChar = this.peekChar();
            for (;;) {
                if (this.currChar === endChar) {
                    if (this.currChar === peekChar) {
                        this.token.str += this.currChar;
                        this.nextChar();
                    }
                    break;
                }
                if (this.currChar === "\x00") {
                    this.token.type = this.Type.EOF;
                    return this.token;
                }
                this.token.str += this.currChar;
                this.nextChar();
            }
            this.token.type = this.Type.STRING;
            return this.token;
        }
        if (this.currChar === "\x00") {
            this.token.type = this.Type.EOF;
            return this.token;
        }
        this.token.type = this.Type.SYMBOL;
        this.token.str = this.currChar;
        return this.token;
    },
    nextChar: function() {
        this.currChar = this.peekChar();
        this.cursor++;
        if (this.currChar === "\n" || this.currChar === "\x00") {
            this.token.line++;
        }
    },
    peekChar: function() {
        if (this.cursor >= this.bufferLength) {
            return "\x00";
        }
        return this.buffer.charAt(this.cursor);
    },
    Type: {
        EOF: 0,
        NUMBER: 1,
        BOOL: 2,
        NAME: 3,
        STRING: 4,
        BINOP: 5,
        SYMBOL: 6
    }
};

meta.tokenizer = new meta.Tokenizer();

"use strict";

meta.math = {
    degToRad: function(degree) {
        return degree * Math.PI / 180;
    },
    radToDeg: function(rad) {
        return rad * 180 / Math.PI;
    },
    radiansToPoint: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.atan(dx / dy);
    },
    clamp: function(num, min, max) {
        return num < min ? min : num > max ? max : num;
    },
    map: function(v, a, b, x, y) {
        return v == a ? x : (v - a) * (y - x) / (b - a) + x;
    },
    length: function(x1, y1, x2, y2) {
        var x = x2 - x1;
        var y = y2 - y1;
        return Math.sqrt(x * x + y * y);
    },
    length2: function(x, y) {
        return Math.sqrt(x * x + y * y);
    },
    limit: function(value, maxValue) {
        if (value > maxValue) {
            return maxValue;
        }
        if (value < -maxValue) {
            return -maxValue;
        }
        return value;
    },
    lerp: function(value1, value2, amount) {
        return value1 + (value2 - value1) * amount;
    },
    lookAt: function(srcX, srcY, targetX, targetY) {
        return Math.atan2(targetX - srcX, srcY - targetY);
    },
    lookAtEntity: function(src, target) {
        return meta.math.lookAt(src.x, src.y, target.x, target.y);
    },
    VolumeType: {
        AABB: 0,
        CIRCLE: 1,
        SEGMENT: 2
    }
};

"use strict";

meta.math.Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

meta.math.Vector2.prototype = {
    reset: function() {
        this.x = 0;
        this.y = 0;
    },
    set: function(x, y) {
        this.x = x;
        this.y = y;
    },
    add: function(value) {
        this.x += value;
        this.y += value;
    },
    sub: function(value) {
        this.x -= value;
        this.y -= value;
    },
    mul: function(value) {
        this.x *= value;
        this.y *= value;
    },
    div: function(value) {
        this.x /= value;
        this.y /= value;
    },
    addVec2: function(vec) {
        this.x += vec.x;
        this.y += vec.y;
    },
    subVec2: function(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    },
    mulVec2: function(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
    },
    divVec2: function(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    normalize: function() {
        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
        } else {
            this.x = 0;
            this.y = 0;
        }
    },
    dot: function(vec) {
        return this.x * vec.x + this.y * vec.y;
    },
    truncate: function(max) {
        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > max) {
            this.x *= max / length;
            this.y *= max / length;
        }
    },
    limit: function(max) {
        if (this.x > max) {
            this.x = max;
        } else if (this.x < -max) {
            this.x = -max;
        }
        if (this.y > max) {
            this.y = max;
        } else if (this.y < -max) {
            this.y = -max;
        }
    },
    clamp: function(minX, minY, maxX, maxY) {
        this.x = Math.min(Math.max(this.x, minX), maxX);
        this.y = Math.min(Math.max(this.y, minY), maxY);
    },
    lengthSq: function() {
        return this.x * this.x + this.y * this.y;
    },
    heading: function() {
        var angle = Math.atan2(-this.y, this.x);
        return -angle + Math.PI * .5;
    },
    perp: function() {
        var tmpX = this.x;
        this.x = -this.y;
        this.y = tmpX;
    },
    reflect: function(normal) {
        var value = this.dot(normal);
        this.x -= 2 * value * normal.x;
        this.y -= 2 * value * normal.y;
    },
    print: function(str) {
        if (str) {
            console.log('[vec "' + str + '"] x: ' + this.x + " y: " + this.y);
        } else {
            console.log("[vec] x: " + this.x + " y: " + this.y);
        }
    }
};

"use strict";

meta.math.AABB = function(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;
    this.pivotPosX = this.width * this.pivotX;
    this.pivotPosY = this.height * this.pivotY;
    this.minX = this.x;
    this.minY = this.y;
    this.maxX = this.x + this.width;
    this.maxY = this.y + this.height;
};

meta.math.AABB.prototype = {
    set: function(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.pivotPosX = this.width * this.pivotX;
        this.pivotPosY = this.height * this.pivotY;
        this.minX = this.x;
        this.minY = this.y;
        this.maxX = this.x + this.width;
        this.maxY = this.y + this.height;
    },
    position: function(x, y) {
        this.x = x;
        this.y = y;
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    move: function(x, y) {
        this.x += x;
        this.y += y;
        this.minX += x;
        this.minY += y;
        this.maxX += x;
        this.maxY += y;
    },
    resize: function(width, height) {
        this.width = width;
        this.height = height;
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.pivotPosX = this.width * this.pivotX;
        this.pivotPosY = this.height * this.pivotY;
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    pivot: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this.pivotX = x;
        this.pivotY = y;
        this.pivotPosX = this.width * this.pivotX;
        this.pivotPosY = this.height * this.pivotY;
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    vsAABB: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return false;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return false;
        }
        return true;
    },
    vsBorderAABB: function(src) {
        if (this.maxX <= src.minX || this.minX >= src.maxX) {
            return false;
        }
        if (this.maxY <= src.minY || this.minY >= src.maxY) {
            return false;
        }
        return true;
    },
    vsAABBIntersection: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return 0;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return 0;
        }
        if (this.minX > src.minX || this.minY > src.minY) {
            return 1;
        }
        if (this.maxX < src.maxX || this.maxY < src.maxY) {
            return 1;
        }
        return 2;
    },
    vsPoint: function(x, y) {
        if (this.minX > x || this.maxX < x) {
            return false;
        }
        if (this.minY > y || this.maxY < y) {
            return false;
        }
        return true;
    },
    vsBorderPoint: function(x, y) {
        if (this.minX >= x || this.maxX <= x) {
            return false;
        }
        if (this.minY >= y || this.maxY <= y) {
            return false;
        }
        return true;
    },
    getSqrDistance: function(x, y) {
        var tmp;
        var sqDist = 0;
        if (x < this.minX) {
            tmp = this.minX - x;
            sqDist += tmp * tmp;
        }
        if (x > this.maxX) {
            tmp = x - this.maxX;
            sqDist += tmp * tmp;
        }
        if (y < this.minY) {
            tmp = this.minY - y;
            sqDist += tmp * tmp;
        }
        if (y > this.maxY) {
            tmp = y - this.maxY;
            sqDist += tmp * tmp;
        }
        return sqDist;
    },
    getDistanceVsAABB: function(aabb) {
        var centerX = this.minX + (this.maxX - this.minX) / 2;
        var centerY = this.minY + (this.maxY - this.minY) / 2;
        var srcCenterX = aabb.minX + (aabb.maxY - aabb.minY) / 2;
        var srcCenterY = aabb.minY + (aabb.maxY - aabb.minY) / 2;
        var diffX = srcCenterX - centerX;
        var diffY = srcCenterY - centerY;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    },
    isUndefined: function() {
        return this.maxY === void 0;
    },
    genCircle: function() {
        var width = this.maxX - this.minX;
        var height = this.maxY - this.minY;
        var radius;
        if (width > height) {
            radius = width / 2;
        } else {
            radius = height / 2;
        }
        return new meta.math.Circle(this.x, this.y, radius);
    },
    print: function(str) {
        if (str) {
            console.log("(AABB) " + str + " minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        } else {
            console.log("(AABB) minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        }
    },
    pivotX: 0,
    pivotY: 0,
    type: meta.math.VolumeType.AABB
};

"use strict";

meta.math.AABBext = function() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.halfWidth = 0;
    this.halfHeight = 0;
    this.initWidth = 0;
    this.initHeight = 0;
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
};

meta.math.AABBext.prototype = {
    position: function(x, y) {
        this.x = x;
        this.y = y;
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    move: function(x, y) {
        this.x += x;
        this.y += y;
        this.minX += x;
        this.minY += y;
        this.maxX += x;
        this.maxY += y;
    },
    updatePos: function() {
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    pivot: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this.pivotX = x;
        this.pivotY = y;
        this.initPivotPosX = this.initWidth * this.pivotX | 0;
        this.initPivotPosY = this.initHeight * this.pivotY | 0;
        this.updatePivotPos();
    },
    updatePivotPos: function() {
        if (this.scaleX > 0) {
            this.pivotPosX = this.pivotX * this.width;
        } else {
            this.pivotPosX = (1 - this.pivotX) * this.width;
        }
        if (this.scaleY > 0) {
            this.pivotPosY = this.pivotY * this.height;
        } else {
            this.pivotPosY = (1 - this.pivotY) * this.height;
        }
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    resize: function(width, height) {
        this.initWidth = width;
        this.initHeight = height;
        this.initPivotPosX = width * this.pivotX | 0;
        this.initPivotPosY = height * this.pivotY | 0;
        this.width = width * Math.abs(this.scaleX) | 0;
        this.height = height * Math.abs(this.scaleY) | 0;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.updatePivotPos();
    },
    scale: function(x, y) {
        this.scaleX = x * this.flipX;
        this.scaleY = y * this.flipY;
        this.width = Math.floor(this.initWidth * x);
        this.height = Math.floor(this.initHeight * y);
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.updatePosTransform();
    },
    flip: function(x, y) {
        if (x === void 0) {
            this.flipX = -this.flipX;
            this.scaleX *= -1;
        } else if (this.flipX !== x) {
            this.flipX = x;
            this.scaleX *= -1;
        }
        if (y === void 0) {} else if (this.flipY !== y) {
            this.flipY = y;
            this.scaleY *= -1;
        }
        this.updatePosTransform();
    },
    rotate: function(angle) {
        var pi2 = Math.PI * 2;
        var angle = angle % pi2;
        if (angle < 0) {
            angle += pi2;
        }
        this.angle = angle;
        this.sin = Math.sin(angle);
        this.cos = Math.cos(angle);
        this.m11 = this.cos * this.scaleX;
        this.m12 = this.sin * this.scaleX;
        this.m21 = -this.sin * this.scaleY;
        this.m22 = this.cos * this.scaleY;
        this.__transformed = 1;
    },
    updatePosTransform: function() {
        if (this.scaleX > 0) {
            this.pivotPosX = this.pivotX * this.width;
        } else {
            this.pivotPosX = (1 - this.pivotX) * this.width;
        }
        if (this.scaleY > 0) {
            this.pivotPosY = this.pivotY * this.height;
        } else {
            this.pivotPosY = (1 - this.pivotY) * this.height;
        }
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
        this.m11 = this.cos * this.scaleX;
        this.m12 = this.sin * this.scaleX;
        this.m21 = -this.sin * this.scaleY;
        this.m22 = this.cos * this.scaleY;
        this.__transformed = 1;
    },
    vsAABB: function(src) {
        if (this.maxX <= src.minX || this.minX >= src.maxX) {
            return false;
        }
        if (this.maxY <= src.minY || this.minY >= src.maxY) {
            return false;
        }
        return true;
    },
    vsAABBIntersection: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return 0;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return 0;
        }
        if (this.minX >= src.minX || this.minY >= src.minY) {
            return 1;
        }
        if (this.maxX <= src.maxX || this.maxY <= src.maxY) {
            return 1;
        }
        return 2;
    },
    vsPoint: function(x, y) {
        if (this.minX >= x || this.maxX <= x) {
            return false;
        }
        if (this.minY >= y || this.maxY <= y) {
            return false;
        }
        return true;
    },
    getSqrDistance: function(x, y) {
        var tmp;
        var sqDist = 0;
        if (x < this.minX) {
            tmp = this.minX - x;
            sqDist += tmp * tmp;
        }
        if (x > this.maxX) {
            tmp = x - this.maxX;
            sqDist += tmp * tmp;
        }
        if (y < this.minY) {
            tmp = this.minY - y;
            sqDist += tmp * tmp;
        }
        if (y > this.maxY) {
            tmp = y - this.maxY;
            sqDist += tmp * tmp;
        }
        return sqDist;
    },
    getDistanceVsAABB: function(aabb) {
        var centerX = this.minX + (this.maxX - this.minX) / 2;
        var centerY = this.minY + (this.maxY - this.minY) / 2;
        var srcCenterX = aabb.minX + (aabb.maxY - aabb.minY) / 2;
        var srcCenterY = aabb.minY + (aabb.maxY - aabb.minY) / 2;
        var diffX = srcCenterX - centerX;
        var diffY = srcCenterY - centerY;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    },
    genCircle: function() {
        var width = this.maxX - this.minX;
        var height = this.maxY - this.minY;
        var radius;
        if (width > height) {
            radius = width / 2;
        } else {
            radius = height / 2;
        }
        return new meta.math.Circle(this.x, this.y, radius);
    },
    print: function(str) {
        if (str) {
            console.log("(Volume) " + str + " minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        } else {
            console.log("(Volume) minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        }
    },
    pivotX: 0,
    pivotY: 0,
    pivotPosX: 0,
    pivotPosY: 0,
    initPivotPosX: 0,
    initPivotPosY: 0,
    anchorPosX: 0,
    anchorPosY: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: 1,
    flipY: 1,
    angle: 0,
    sin: 0,
    cos: 1,
    m11: 1,
    m12: 0,
    m21: 0,
    m22: 1,
    __transformed: 0,
    type: meta.math.VolumeType.AABB
};

"use strict";

meta.math.Circle = function(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.minX = x - radius;
    this.minY = y - radius;
    this.maxX = x + radius;
    this.maxY = y + radius;
};

meta.math.Circle.prototype = {
    position: function(x, y) {
        this.x = x;
        this.y = y;
        this.minX = x - this.radius;
        this.minY = y - this.radius;
        this.maxX = x + this.radius;
        this.maxY = y + this.radius;
    },
    move: function(addX, addY) {
        this.x += addX;
        this.y += addY;
        this.minX += addX;
        this.minY += addY;
        this.maxX += addX;
        this.maxY += addY;
    },
    vsPoint: function(x, y) {
        return (this.x - x) * 2 + (this.y - y) * 2 <= radius * 2;
    },
    vsAABB: function(aabb) {},
    vsCircle: function(circle) {
        var dx = circle.x - this.x;
        var dy = circle.y - this.y;
        var radii = this.radius + circle.radius;
        if (dx * dx + dy * dy < radii * radii) {
            return true;
        }
        return false;
    },
    overlapCircle: function(circle) {
        var distance = Math.sqrt((this.x - circle.x) * (this.y - circle.y));
        if (distance > this.radius + circle.radius) {
            return 0;
        } else if (distance <= Math.abs(this.radius + circle.radius)) {
            return 1;
        }
        return 2;
    },
    genAABB: function() {
        return new meta.math.AABB(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
    },
    print: function(str) {
        if (str) {
            console.log("[" + str + "] x:", this.x, "y:", this.y, "raidus:", this.radius);
        } else {
            console.log("x:", this.x, "y:", this.y, "raidus:", this.radius);
        }
    },
    type: meta.math.VolumeType.CIRCLE
};

"use strict";

meta.math.Matrix4 = function() {
    this.m = new Float32Array(16);
    this.m[0] = 1;
    this.m[5] = 1;
    this.m[10] = 1;
    this.m[15] = 1;
};

meta.math.Matrix4.prototype = {
    reset: function() {
        this.m[0] = 1;
        this.m[1] = 0;
        this.m[2] = 0;
        this.m[3] = 0;
        this.m[4] = 0;
        this.m[5] = 1;
        this.m[6] = 0;
        this.m[7] = 0;
        this.m[8] = 0;
        this.m[9] = 0;
        this.m[10] = 1;
        this.m[11] = 0;
        this.m[12] = 0;
        this.m[13] = 0;
        this.m[14] = 0;
        this.m[15] = 1;
    },
    scale: function(x, y, z) {
        this.m[0] = x;
        this.m[5] = y;
        this.m[10] = z;
    },
    ortho: function(left, right, bottom, top, zNear, zFar) {
        this.m[0] = 2 / (right - left);
        this.m[1] = 0;
        this.m[2] = 0;
        this.m[3] = 0;
        this.m[4] = 0;
        this.m[5] = 2 / (top - bottom);
        this.m[6] = 0;
        this.m[7] = 0;
        this.m[8] = 0;
        this.m[9] = 0;
        this.m[10] = -2 / (zFar - zNear);
        this.m[11] = 0;
        this.m[12] = -(right + left) / (right - left);
        this.m[13] = -(top + bottom) / (top - bottom);
        this.m[14] = -(zFar + zNear) / (zFar - zNear);
        this.m[15] = 1;
    }
};

"use strict";

meta.math.Random = function() {
    this.seed = 0;
    this.a = 0;
    this.m = 0;
    this.q = 0;
    this.r = 0;
    this.oneOverM = 0;
    this.init();
};

meta.math.Random.prototype = {
    init: function() {
        this.setSeed(3456789012, true);
    },
    generate: function() {
        var hi = Math.floor(this.seed / this.q);
        var lo = this.seed % this.q;
        var test = this.a * lo - this.r * hi;
        if (test > 0) {
            this.seed = test;
        } else {
            this.seed = test + this.m;
        }
        return this.seed * this.oneOverM;
    },
    number: function(min, max) {
        var number = this.generate();
        return Math.round((max - min) * number + min);
    },
    numberF: function(min, max) {
        var number = this.generate();
        return (max - min) * number + min;
    },
    setSeed: function(seed, useTime) {
        if (useTime !== void 0) {
            useTime = true;
        }
        if (useTime === true) {
            var date = new Date();
            this.seed = seed + date.getSeconds() * 16777215 + date.getMinutes() * 65535;
        } else {
            this.seed = seed;
        }
        this.a = 48271;
        this.m = 2147483647;
        this.q = Math.floor(this.m / this.a);
        this.r = this.m % this.a;
        this.oneOverM = 1 / this.m;
    }
};

meta.random = new meta.math.Random();

"use strict";

var Resource = {};

Resource.Event = {
    FAILED: "res-failed",
    UNLOADED: "res-unloaded",
    LOADED: "res-loaded",
    RESIZE: "res-resize",
    CHANGED: "res-changed",
    ADDED: "res-added",
    LOADING_START: "res-loading-started",
    LOADING_END: "res-loading-ended",
    LOADING_UPDATE: "red-loadig-update"
};

Resource.Type = {
    BASIC: 0,
    TEXTURE: 1,
    SOUND: 2,
    SPRITE_SHEET: 3,
    FONT: 4
};

Resource.TextureType = {
    UNKNOWN: -1,
    CANVAS: 0,
    WEBGL: 1
};

"use strict";

meta.class("Resource.Manager", {
    init: function() {
        this.onAdded = meta.createChannel(Resource.Event.ADDED);
        this.onLoaded = meta.createChannel(Resource.Event.LOADED);
        this.onLoadingStart = meta.createChannel(Resource.Event.LOADING_START);
        this.onLoadingEnd = meta.createChannel(Resource.Event.LOADING_END);
        this.onLoadingUpdate = meta.createChannel(Resource.Event.LOADING_UPDATE);
        meta.audio = new Resource.AudioManager();
        var self = this;
        this._xhr = new XMLHttpRequest();
        this._xhr.onreadystatechange = function() {
            self._loadFileStateChange();
        };
        meta.engine.onAdapt.add(this.onAdapt, this);
    },
    add: function(resource) {
        if (resource.flags & resource.Flag.ADDED) {
            return;
        }
        resource.flags |= resource.Flag.ADDED;
        var subBuffer = this.resources[resource.type];
        if (!subBuffer) {
            subBuffer = {};
            this.resources[resource.type] = subBuffer;
        }
        var path = resource.path;
        if (resource.name === "unknown" && path) {
            var wildcardIndex = path.lastIndexOf(".");
            var slashIndex = path.lastIndexOf("/");
            if (wildcardIndex < 0 || path.length - wildcardIndex > 5) {
                resource.name = resource.tag + path.slice(slashIndex + 1);
            } else {
                resource.name = resource.tag + path.slice(slashIndex + 1, wildcardIndex);
            }
        }
        if (subBuffer[resource.name]) {
            console.warn("(Resource.Manager.add) There is already a resource(" + meta.enumToString(Resource.Type, resource.type) + ") added with a name: " + resource.name);
            return null;
        }
        subBuffer[resource.name] = resource;
        this.onAdded.emit(resource, Resource.Event.ADDED);
        return resource;
    },
    remove: function(resource) {
        var subBuffer = this.resources[resource.type];
        if (!subBuffer) {
            console.warn("(Resource.Manager.remove) Resource(" + meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
            return;
        }
        if (!subBuffer[resource.name]) {
            console.warn("(Resource.Manager.remove) Resource(" + meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
            return;
        }
        subBuffer[resource.name] = null;
    },
    _updateLoading: function() {
        this.numToLoad--;
        this.onLoadingUpdate.emit(this, Resource.Event.LOADING_UPDATE);
        if (this.numToLoad === 0) {
            this.numTotalToLoad = 0;
            this.loading = false;
            this.onLoadingEnd.emit(this, Resource.Event.LOADING_END);
        }
    },
    loadFile: function(path, onSuccess) {
        if (!this.loading) {
            this.loading = true;
            this.onLoadingStart.emit(this, Resource.Event.LOADING_START);
        }
        this.numToLoad++;
        this.numTotalToLoad++;
        this._xhrOnSuccess = onSuccess;
        this._xhr.open("GET", path, true);
        this._xhr.send();
    },
    _loadFileStateChange: function() {
        if (this._xhr.readyState === 4) {
            if (this._xhr.status === 200) {
                if (this._xhrOnSuccess) {
                    this._xhrOnSuccess(this._xhr.response);
                }
            }
            this._updateLoading();
        }
    },
    addToLoad: function(resource) {
        if (!this.loading) {
            this.loading = true;
            this.onLoadingStart.emit(this, Resource.Event.LOADING_START);
        }
        this.add(resource);
        resource.loading = true;
        resource.currStep = 0;
        this.numToLoad += resource.steps;
        this.numTotalToLoad += resource.steps;
    },
    loadSuccess: function(resource) {
        var subBuffer = this.resourcesInUse[resource.type];
        if (!subBuffer) {
            subBuffer = [];
            this.resourcesInUse[resource.type] = subBuffer;
        }
        resource.currStep++;
        this.numLoaded++;
        resource.loading = false;
        resource.inUse = true;
        subBuffer.push(resource);
        this.onLoaded.emit(resource, Resource.Event.LOADED);
        this._updateLoading();
    },
    loadFailed: function(resource) {
        this.numLoaded += resource.steps - resource.currStep;
        this._updateLoading();
        resource.loading = false;
    },
    nextStep: function(resource) {
        if (resource.currStep < resource.steps) {
            resource.currStep++;
            this.numLoaded++;
            this._updateLoading();
        }
    },
    getResource: function(name, type) {
        var subBuffer = this.resources[type];
        if (!subBuffer) {
            return null;
        }
        var texture = subBuffer[name];
        if (!texture) {
            return null;
        }
        return texture;
    },
    getTexture: function(name) {
        var subBuffer = this.resources[Resource.Type.TEXTURE];
        if (!subBuffer) {
            return null;
        }
        var texture = subBuffer[name];
        if (!texture) {
            return null;
        }
        return texture;
    },
    getSound: function(name) {
        if (!name) {
            console.warn("[Resource.Manager.getSound]:", "No name specified.");
            return null;
        }
        var subBuffer = this.resources[Resource.Type.SOUND];
        if (!subBuffer) {
            return null;
        }
        var sound = subBuffer[name];
        if (!sound) {
            return null;
        }
        return sound;
    },
    addToQueue: function(resource) {
        if (!this._syncQueue) {
            this._syncQueue = [];
        }
        this._syncQueue.push(resource);
    },
    loadNextFromQueue: function() {
        this.isSyncLoading = false;
        if (!this._syncQueue || !this._syncQueue.length) {
            return;
        }
        this._syncQueue[this._syncQueue.length - 1].forceLoad(true);
        this._syncQueue.pop();
    },
    onAdapt: function(data, event) {
        var unitRatio = meta.unitRatio;
        var texture;
        var textures = this.resources[Resource.Type.TEXTURE];
        for (var key in textures) {
            texture = textures[key];
            texture.unitRatio = unitRatio;
            texture.load();
        }
    },
    getUniqueID: function() {
        return ++this._uniqueID;
    },
    _xhr: null,
    _xhrOnSuccess: null,
    resources: {},
    resourcesInUse: {},
    rootPath: "",
    numLoaded: 0,
    numToLoad: 0,
    numTotalToLoad: 0,
    _syncQueue: null,
    isSyncLoading: false,
    _uniqueID: 0,
    loading: false,
    onAdded: null,
    onLoaded: null,
    onLoadingStart: null,
    onLoadingEnd: null,
    onLoadingUpdate: null
});

"use strict";

meta.class("Resource.AudioManager", {
    init: function() {
        var audioProto = Resource.Sound.prototype;
        if (meta.device.audioAPI && meta.flags.audioAPI) {
            this.context = new AudioContext();
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.context.destination);
            this.gainNode.gain.value = this._volume;
            audioProto._context = this.context;
            audioProto._prepare = audioProto._prepare_WebAudio;
            audioProto._loadFromPath = audioProto._loadFromPath_WebAudio;
            audioProto._createInstance = audioProto._createInstance_WebAudio;
            audioProto.steps = 2;
            if (meta.device.support.consoleCSS) {
                console.log("%cAudio: %cWebAudio ", "font-weight: bold; padding: 2px 0 2px 0;", "padding: 2px 0 2px 0;");
            } else {
                console.log("Audio: WebAudio");
            }
        } else {
            this.audioAPI = false;
            audioProto._prepare = audioProto._prepare_Audio;
            audioProto._loadFromPath = audioProto._loadFromPath_Audio;
            audioProto._createInstance = audioProto._createInstance_Audio;
            audioProto._syncLoading = true;
            if (meta.device.support.consoleCSS) {
                console.log("%cAudio: %c<audio> ", "font-weight: bold; padding: 2px 0 1px 0; width: 500px;", "padding: 2px 0 1px 0;");
            } else {
                console.log("Audio: <audio>");
            }
        }
    },
    set volume(value) {
        this._volume = meta.math.clamp(value, 0, 1);
        if (this._mute) {
            return;
        }
        if (meta.device.audioAPI) {
            this.gainNode.gain.value = this._volume;
        } else {
            var sounds = meta.resources.resources[Resource.Type.SOUND];
            for (var key in sounds) {
                sounds[key].volume = this._volume;
            }
        }
    },
    get volume() {
        return this._volume;
    },
    set mute(value) {
        if (this._mute === value) {
            return;
        }
        this._mute = value;
        var volume;
        if (value) {
            volume = 0;
        } else {
            volume = this._volume;
        }
        if (meta.device.audioAPI) {
            this.gainNode.gain.value = volume;
        } else {
            var sounds = meta.resources.resources[Resource.Type.SOUND];
            for (var key in sounds) {
                sounds[key].volume = volume;
            }
        }
    },
    get mute() {
        return this._mute;
    },
    context: null,
    gainNode: null,
    _volume: .5,
    _mute: false,
    audioAPI: true
});

"use strict";

meta.class("Resource.Basic", {
    init: function(data, tag) {
        this.id = meta.resources.getUniqueID();
        if (tag) {
            this.tag = tag;
        }
        if (this.onInit) {
            this.onInit(data, tag);
        }
    },
    onInit: null,
    subscribe: function(func, owner) {
        if (!this.chn) {
            this.chn = meta.createChannel("__res" + this.id);
        }
        this.chn.add(func, owner);
    },
    unsubscribe: function(owner) {
        if (!this.chn) {
            return;
        }
        this.chn.remove(owner);
        if (this.chn.numSubs === 0) {
            this.chn.remove();
            this.chn = null;
        }
    },
    emit: function(data, event) {
        if (this.chn) {
            this.chn.emit(data, event);
        }
    },
    set loaded(value) {
        if (value) {
            if (!this._loaded) {
                this._loaded = value;
                this.emit(this, Resource.Event.LOADED);
            } else {
                this._loaded = value;
                this.emit(this, Resource.Event.CHANGED);
            }
        } else {
            if (this._loaded) {
                this._loaded = value;
                this.emit(this, Resource.Event.UNLOADED);
            }
        }
    },
    get loaded() {
        return this._loaded;
    },
    Flag: {
        ADDED: 8
    },
    id: 0,
    flags: 0,
    type: Resource.Type.BASIC,
    name: "unknown",
    path: "",
    fullPath: "",
    tag: "",
    chn: null,
    _loaded: false,
    loading: false,
    used: false,
    steps: 1,
    currStep: 0
});

"use strict";

meta.class("Resource.Texture", "Resource.Basic", {
    onInit: function(data, tag) {
        this.generate();
        if (data instanceof File) {
            this.loadFile(data);
        } else {
            var type = typeof data;
            if (type === "string") {
                this.load(data);
            } else if (type === "object") {
                for (var key in data) {
                    this[key] = data[key];
                }
                if (data.frames) {
                    this.animated = true;
                } else if (this.framesX > 1 || this.framesY > 1) {
                    this.frames = this.framesX * this.framesY;
                    this.animated = true;
                }
                if (this.path) {
                    this.load(this.path);
                }
            }
        }
    },
    remove: function() {},
    generate: function() {
        this.loaded = true;
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.trueFullWidth;
        this.canvas.height = this.trueFullHeight;
        this.ctx = this.canvas.getContext("2d");
    },
    load: function(path) {
        if (this.loading) {
            return;
        }
        this.loaded = false;
        if (!path) {
            return;
        }
        this.path = path;
        var wildCardIndex = this.path.lastIndexOf(".");
        if (wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
            this.path += ".png";
        }
        if (meta.cache.currResolution) {
            this.fullPath = meta.resources.rootPath + meta.cache.currResolution.path + this.path;
        } else {
            this.fullPath = meta.resources.rootPath + this.path;
        }
        var self = this;
        var img = new Image();
        img.onload = function() {
            if (!img.complete) {
                console.warn("(Resource.Texture.load) Could not load texture from - " + img.src);
                meta.resources.loadFailed(self);
                return;
            }
            self.createFromImg(img);
            meta.resources.loadSuccess(self);
        };
        img.onerror = function(event) {
            meta.resources.loadFailed(self);
            self.emit(this, Resource.Event.FAILED);
        };
        img.src = this.fullPath;
        meta.resources.addToLoad(this);
    },
    loadFile: function(file) {
        if (this.loading) {
            return;
        }
        this.loaded = false;
        this.path = window.URL.createObjectURL(file);
        this.fullPath = this.path;
        var self = this;
        var img = new Image();
        img.onload = function() {
            if (!img.complete) {
                console.warn("(Resource.Texture.load) Could not load texture from - " + img.src);
                meta.resources.loadFailed(self);
                return;
            }
            self.createFromImg(img);
            meta.resources.loadSuccess(self);
            window.URL.revokeObjectURL(self.path);
            console.log(self.name);
        };
        img.onerror = function(event) {
            meta.resources.loadFailed(self);
            self.emit(this, Resource.Event.FAILED);
        };
        img.src = this.fullPath;
        meta.resources.addToLoad(this);
    },
    createFromImg: function(img) {
        if (this._loaded) {
            this.clear();
        }
        this.resizeSilently(img.width, img.height);
        this.ctx.drawImage(img, 0, 0);
        this.unitRatio = meta.unitRatio;
        this._reloading = false;
        this.loaded = true;
    },
    _createCachedImg: function() {
        if (this._cachedImg) {
            return;
        }
        this._cachedImg = document.createElement("canvas");
        this._cachedImg.width = this.trueFullWidth;
        this._cachedImg.height = this.trueFullHeight;
        this._cachedCtx = this._cachedImg.getContext("2d");
    },
    resize: function(width, height) {
        if (this.trueFullWidth === width && this.trueFullHeight === height) {
            return;
        }
        this.resizeSilently(width, height);
        this.loaded = true;
    },
    resizeSilently: function(width, height) {
        if (this.trueFullWidth === width && this.trueFullHeight === height) {
            return;
        }
        this.flags |= this.TextureFlag.RESIZED;
        this.trueFullWidth = width;
        this.trueFullHeight = height;
        if (this.animated) {
            this.trueWidth = width / this.framesX;
            this.trueHeight = height / this.framesY;
        } else {
            this.trueWidth = width;
            this.trueHeight = height;
        }
        var unitRatio = meta.engine.unitRatio;
        this.width = this.trueWidth * unitRatio + .5 | 0;
        this.height = this.trueHeight * unitRatio + .5 | 0;
        this.fullWidth = this.trueFullWidth * unitRatio + .5 | 0;
        this.fullHeight = this.trueFullHeight * unitRatio + .5 | 0;
        this.halfWidth = this.width * .5;
        this.halfHeight = this.height * .5;
        if (this._loaded) {
            if (this.canvas.width > 1 && this.canvas.height > 1) {
                this._tmpImg.width = this.canvas.width;
                this._tmpImg.height = this.canvas.height;
                this._tmpCtx.drawImage(this.canvas, 0, 0);
                this.canvas.width = this.trueFullWidth;
                this.canvas.height = this.trueFullHeight;
                this.ctx.drawImage(this._tmpImg, 0, 0);
            } else {
                this.canvas.width = this.trueFullWidth;
                this.canvas.height = this.trueFullHeight;
            }
        } else {
            this.canvas.width = this.trueFullWidth;
            this.canvas.height = this.trueFullHeight;
        }
    },
    upResize: function(width, height) {
        if (width < this.trueFullWidth) {
            width = this.trueFullWidth;
        }
        if (height < this.trueFullHeight) {
            height = this.trueFullHeight;
        }
        this.resize(width, height);
    },
    draw: function(ctx, x, y) {
        if (!this.fromAtlas) {
            ctx.drawImage(this.canvas, x, y);
        } else {
            ctx.drawImage(this.ptr.canvas, this._x, this._y, this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
        }
    },
    drawFrame: function(ctx, x, y, frame) {
        ctx.drawImage(this.canvas, this.trueWidth * (frame % this.framesX), this.trueHeight * Math.floor(frame / this.framesX), this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
    },
    clear: function() {
        this.ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
    },
    drawOver: function(texture, x, y) {
        if (!texture) {
            console.warn("(Resource.Texture.drawOver) No texture specified.");
            return;
        }
        x = x || 0;
        y = y || 0;
        if (typeof texture === "string") {
            var obj = meta.getTexture(texture);
            if (!obj) {
                console.warn("(Resource.Texture.drawOver) No such texture with name - " + texture);
                return;
            }
            texture = obj;
        }
        if (texture.textureType === Resource.TextureType.WEBGL) {
            if (texture._canvasCache) {
                texture = texture._canvasCache;
            } else {
                texture._canvasCache = new Resource.Texture(Resource.TextureType.CANVAS, texture.path);
                texture._canvasCache.load();
                texture = texture._canvasCache;
                this._loadCache = {
                    name: "drawOver",
                    texture: texture,
                    x: x,
                    y: y
                };
                this.isLoaded = false;
                texture.subscribe(this.onTextureCacheEvent, this);
                return;
            }
        }
        var ctx = this.ctx;
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.drawImage(texture.image, x, y);
        if (this.textureType) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    generateAlphaMask: function() {
        if (!this._isLoaded) {
            console.warn("[Resource.Texture.generateMask]:", "Texture is not loaded yet.");
            return;
        }
        if (this.textureType !== 0) {
            console.warn("[Resource.Texture.generateMask]:", "Only canvas textures are supported currently.");
            return;
        }
        var alphaMask = new Resource.Texture(Resource.TextureType.CANVAS);
        alphaMask.resize(this.trueFullWidth, this.trueFullHeight);
        var imgData = this.ctx.getImageData(0, 0, this.trueFullWidth, this.trueFullHeight);
        var data = imgData.data;
        var numBytes = data.length;
        for (var i = 0; i < numBytes; i += 4) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        }
        alphaMask.ctx.putImageData(imgData, 0, 0);
        alphaMask.isLoaded = true;
        return alphaMask;
    },
    onTextureCacheEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            data.unsubscribe(this);
            if (this._loadCache.name === "drawOver") {
                this.drawOver(this._loadCache.texture, this._loadCache.x, this._loadCache.y);
            } else {
                this[this._loadCache.name](this._loadCache.data);
            }
            this._loadCache = null;
        }
    },
    offset: function(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        if (this._loaded) {
            this.emit(this, Resource.Event.CHANGED);
        }
    },
    getData: function() {
        return this.ctx.getImageData(0, 0, this.trueWidth, this.trueHeight).data;
    },
    getPixelAt: function(x, y) {
        return this.ctx.getImageData(x, y, 1, 1).data;
    },
    applyCanvas: function(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.resize(canvas.width, canvas.height);
    },
    TextureFlag: {
        RESIZED: 1
    },
    type: Resource.Type.TEXTURE,
    ptr: null,
    canvas: null,
    ctx: null,
    flags: 0,
    _x: 0,
    _y: 0,
    width: 0,
    height: 0,
    _width: 0,
    _height: 0,
    fullWidth: 0,
    fullHeight: 0,
    _widthRatio: 0,
    _heightRatio: 0,
    offsetX: 0,
    offsetY: 0,
    unitRatio: 1,
    fps: 9,
    frames: 1,
    framesX: 1,
    framesY: 1,
    fromAtlas: false,
    reloading: false,
    _tmpImg: null,
    _tmpCtx: null,
    _cachedImg: null,
    _cachedCtx: null,
    _anim: null,
    _frames: null,
    _loadCache: null,
    _canvasCache: null
});

Resource.Texture.prototype._tmpImg = document.createElement("canvas");

Resource.Texture.prototype._tmpCtx = Resource.Texture.prototype._tmpImg.getContext("2d");

"use strict";

meta.class("Resource.Sound", "Resource.Basic", {
    onInit: function(data, tag) {
        this._instances = [];
        this._prepare();
        if (typeof data === "string") {
            this.load(data);
        }
    },
    _prepare: null,
    _prepare_Audio: function() {
        var self = this;
        this._context = this._getInstance();
        this._context.audio.addEventListener("error", function() {
            if (!self.format) {
                self._loadNextExtension();
            } else {
                self._onLoadFailed();
            }
        });
        this._numInstancesUsed = 0;
    },
    _prepare_WebAudio: function() {
        var self = this;
        this._request = new XMLHttpRequest();
        this._request.responseType = "arraybuffer";
        this._request.onreadystatechange = function() {
            self._onStateChange();
        };
        this._gainNode = meta.audio.context.createGain();
        this._gainNode.connect(meta.audio.gainNode);
    },
    load: function(path) {
        if (this.loading) {
            return;
        }
        var wildCardIndex = path.lastIndexOf(".");
        if (wildCardIndex !== -1 && path.length - wildCardIndex <= 5) {
            this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
            this.path = meta.resources.rootPath + path.substr(0, wildCardIndex);
        } else {
            this.path = meta.resources.rootPath + path;
        }
        this.loading = true;
        this.loaded = false;
        meta.resources.addToLoad(this);
        this._loadNextExtension();
    },
    _loadNextExtension: function() {
        var path;
        var formats = meta.device.audioFormats;
        var numFormats = formats.length;
        if (this.format) {
            var supported = false;
            for (var n = 0; n < numFormats; n++) {
                if (this.format === formats[n]) {
                    supported = true;
                    break;
                }
            }
            if (!supported) {
                console.log("(Resource.Sound) Trying to load unsupported sound format: " + this.format);
                this._onLoadFailed();
                return;
            }
            path = this.path + "." + this.format;
        } else {
            this._requestFormat++;
            if (this._requestFormat > numFormats) {
                this._onLoadFailed();
                return;
            }
            path = this.path + "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        this._loadFromPath(path);
    },
    _loadFromPath: null,
    _loadFromPath_WebAudio: function(path) {
        this._request.open("GET", path, true);
        this._request.send();
    },
    _loadFromPath_Audio: function(path) {
        this._context.audio.src = path;
        this._context.audio.load();
    },
    _onStateChange: function() {
        if (this._request.readyState === 4) {
            if (this._request.status === 200) {
                meta.resources.nextStep(this);
                var self = this;
                this._context.decodeAudioData(this._request.response, function(buffer) {
                    self._onDecodeSuccess(buffer);
                }, function(error) {
                    self._onDecodeError(error);
                });
                this._request = null;
            } else {
                if (!this.format) {
                    this._loadNextExtension();
                } else {
                    this._onLoadFailed();
                }
            }
        }
    },
    _onDecodeSuccess: function(buffer) {
        if (!this.format) {
            this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        this._buffer = buffer;
        this._loading = false;
        this.loaded = true;
        meta.resources.loadSuccess(this);
        var instance;
        var numInstances = this._instances.length;
        for (var i = 0; i < numInstances; i++) {
            instance = this._instances[i];
            if (instance.autoPlay) {
                instance.play();
            }
        }
    },
    _onDecodeError: function(error) {
        console.log(error);
        if (!this.format) {
            this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        console.warn("(Resource.Sound.load) Error decoding file: " + this.path);
        this._loading = false;
        meta.resources.loadFailed(this);
    },
    _onLoadFailed: function() {
        if (!this.format) {
            var format = meta.device.audioFormats[this._requestFormat - 1];
            if (format) {
                this.path += "." + format;
            }
        }
        console.warn("(Resource.Sound.load) Error loading file: " + this.path);
        this._loading = false;
        meta.resources.loadFailed(this);
    },
    onEnd: null,
    play: function(looping, offset) {
        if (meta.audio.audioAPI) {
            this._gainNode.gain.value = this._volume;
        }
        var instance = this._getInstance();
        instance.play(looping, offset);
    },
    stop: function() {
        if (meta.audio.audioAPI) {
            this._gainNode.gain.value = 0;
        }
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i].stop();
        }
    },
    pause: function() {
        if (meta.audio.audioAPI) {
            this._gainNode.gain.value = 0;
        }
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i].pause();
        }
    },
    resume: function() {
        if (meta.audio.audioAPI) {
            this._gainNode.gain.value = this._volume;
        }
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i].resume();
        }
    },
    _createInstance: null,
    _createInstance_WebAudio: function() {
        return new Resource.AudioInstance(this);
    },
    _createInstance_Audio: function() {
        return new Resource.AudioInstance_Audio(this);
    },
    _getInstance: function() {
        if (this._instances.length === this._numInstancesUsed) {
            this._instances.push(this._createInstance());
        }
        var instance = this._instances[this._numInstancesUsed];
        instance.id = this._numInstancesUsed;
        this._numInstancesUsed++;
        return instance;
    },
    _clearInstance: function(instance) {
        this._numInstancesUsed--;
        var lastInstance = this._instances[this._numInstancesUsed];
        lastInstance.id = instance.id;
        this._instances[instance.id] = lastInstance;
        this._instances[this._numInstancesUsed] = instance;
    },
    set volume(value) {
        if (this._volume === value) {
            return;
        }
        this._volume = value;
        if (meta.audio.audioAPI) {
            this._gainNode.gain.value = value;
        } else {
            var numInstances = this._instances.length;
            for (var i = 0; i < numInstances; i++) {
                this._instances[i].volume = value;
            }
        }
    },
    get volume() {
        return this._volume;
    },
    get playing() {
        var instance = this._instances[0];
        if (!instance) {
            return false;
        }
        return instance.playing;
    },
    get paused() {
        var instance = this._instances[0];
        if (!instance) {
            return false;
        }
        return instance.paused;
    },
    get looping() {
        var instance = this._instances[0];
        if (!instance) {
            return false;
        }
        return instance.looping;
    },
    get duration() {
        if (meta.audio.audioAPI) {
            if (this._buffer) {
                return this._buffer.duration;
            } else {
                var instance = this._instances[0];
                if (!instance) {
                    return 0;
                }
                return instance.audio.duration;
            }
        }
        return 0;
    },
    set currentTime(offset) {
        var instance = this._instances[0];
        if (!instance) {
            return;
        }
        instance.currentTime = offset;
    },
    get currentTime() {
        var instance = this._instances[0];
        if (!instance) {
            return 0;
        }
        return instance.currentTime;
    },
    type: Resource.Type.SOUND,
    format: "",
    _instances: null,
    _numInstancesUsed: 0,
    _context: null,
    _buffer: null,
    _request: null,
    _requestFormat: 0,
    _gainNode: null,
    _volume: 1
});

Resource.AudioInstance = function(parent) {
    this.parent = parent;
    this.id = -1;
    this.source = null;
    this.looping = false;
    this.paused = false;
    this.playing = false;
    this.offset = 0;
    this.tStart = 0;
    this.tPaused = 0;
    var self = this;
    this.onEndFunc = function() {
        if (self.parent.onEnd) {
            self.parent.onEnd(self.parent);
        }
        if (!self.paused) {
            if (self.looping) {
                self.source.disconnect();
                self.play(true, 0);
            } else {
                self.parent._clearInstance(self);
            }
        }
    };
};

Resource.AudioInstance.prototype = {
    play: function(looping, offset) {
        looping = looping || false;
        offset = offset || 0;
        this.paused = false;
        if (!this.parent._loaded) {
            this.autoPlay = true;
            this.looping = looping;
            this.offset = offset;
        } else {
            this.playing = true;
            if (!this.autoPlay) {
                this.looping = looping;
                this.offset = offset;
            } else {
                this.autoPlay = false;
            }
            this.source = meta.audio.context.createBufferSource();
            this.source.buffer = this.parent._buffer;
            this.source.connect(this.parent._gainNode);
            this.source.onended = this.onEndFunc;
            if (this.offset < 0) {
                this.offset = 0;
            } else if (this.offset > this.source.buffer.duration) {
                this.offset = this.source.buffer.duration;
            }
            this.source.start(0, this.offset);
            this.tStart = this.source.context.currentTime - this.offset;
        }
    },
    stop: function() {
        if (!this.source) {
            return;
        }
        this.paused = false;
        this.looping = false;
        this.source.stop(this.source.context.currentTime + .2);
    },
    pause: function() {
        if (this.paused) {
            return;
        }
        this.paused = true;
        if (this.playing) {
            this.tPaused = this.source.context.currentTime - this.tStart;
        } else {
            this.tPaused = 0;
        }
        if (this.source) {
            this.source.disconnect(this.parent._gainNode);
            this.source.stop(0);
        }
    },
    resume: function() {
        this.play(this.looping, this.tPaused);
    },
    set currentTime(offset) {
        this.stop();
        this.play(this.looping, offset);
    },
    get currentTime() {
        if (!this.playing) {
            return 0;
        }
        return this.source.context.currentTime - this.tStart;
    },
    autoPlay: false
};

Resource.AudioInstance_Audio = function(parent) {
    this.parent = parent;
    this.id = -1;
    this.looping = false;
    this.paused = false;
    this.playing = false;
    this.offset = 0;
    this.audio = new Audio();
    this.audio.preload = "auto";
    this._canPlay = false;
    this._metaLoaded = false;
    this._loaded = false;
    var self = this;
    this._canPlayFunc = function() {
        self.audio.removeEventListener("canplaythrough", self._canPlayFunc);
        self._canPlay = true;
        if (meta.device.support.onloadedmetadata && self._metaLoaded) {
            self._onLoaded();
        }
    };
    this._metaFunc = function() {
        self.audio.removeEventListener("loadedmetadata", self._metaFunc);
        self._metaLoaded = true;
        if (self.canPlay) {
            self._onLoaded();
        }
    };
    this._onEndedFunc = function() {
        self._onEnd();
    };
    this._addEvents(parent);
};

Resource.AudioInstance_Audio.prototype = {
    play: function(looping, offset) {
        looping = looping || false;
        offset = offset || 0;
        this.paused = false;
        if (!this._loaded) {
            this.autoPlay = true;
            this.looping = looping;
            this.offset = offset;
        } else {
            this.playing = true;
            if (!this.autoPlay) {
                this.looping = looping;
                this.offset = offset;
            } else {
                this.autoPlay = false;
            }
            this.audio.currentTime = this.offset;
            this.audio.play();
        }
    },
    stop: function() {
        this.playing = false;
        this.audio.pause();
        this.parent._clearInstance(this);
    },
    pause: function() {
        this.playing = false;
        this.audio.pause();
    },
    resume: function() {
        this.playing = true;
        this.audio.play();
    },
    _addEvents: function() {
        this.audio.addEventListener("canplaythrough", this._canPlayFunc, false);
        if (meta.device.support.onloadedmetadata) {
            this.audio.addEventListener("loadedmetadata", this._metaFunc, false);
        }
        this.audio.addEventListener("ended", this._onEndedFunc, false);
        if (this.parent._loaded) {
            this.audio.src = this.parent.fullPath;
            this.audio.load();
        }
    },
    _onLoaded: function() {
        if (!this.parent._loaded) {
            if (!this.parent.format) {
                this.parent.path += "." + meta.device.audioFormats[this.parent._requestFormat - 1];
            }
            this.parent._loading = false;
            this.parent.loaded = true;
            this.parent.fullPath = this.parent.path + "." + this.parent.format;
            var instance;
            var instances = this.parent._instances;
            var numInstances = this.parent._instances.length;
            for (var i = 1; i < numInstances; i++) {
                instance = instances[i];
                instance.audio.src = this.parent.fullPath;
                instance.audio.load();
            }
            meta.resources.loadSuccess(parent);
            meta.resources.loadNextFromQueue();
        }
        this._loaded = true;
        if (this.autoPlay) {
            this.play(false, 0);
        }
    },
    _onEnd: function() {
        if (this.looping) {
            this.audio.play();
            this.audio.currentTime = 0;
        } else {
            if (this.playing) {
                this.playing = false;
                this.parent._clearInstance(this);
            }
        }
    },
    set currentTime(time) {
        if (!this.playing) {
            this.audio.play();
            this.audio.currentTime = time || 0;
            this.audio.pause();
        } else {
            this.audio.currentTime = time || 0;
        }
    },
    get currentTime() {
        return this.audio.currentTime;
    },
    set volume(value) {
        var mixedVolume = value * meta.audio._volume;
        this.audio.volume = mixedVolume;
    },
    autoPlay: false
};

"use strict";

meta.class("Resource.SpriteSheet", "Resource.Basic", {
    onInit: function(param, path) {
        if (typeof param === "string") {
            path = param;
            param = void 0;
        } else {
            for (var key in param) {
                this[key] = param[key];
            }
        }
        if (path) {
            var wildCardIndex = path.lastIndexOf(".");
            if (wildCardIndex !== -1 && path.length - wildCardIndex <= 5) {
                this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
                path = path.substr(0, wildCardIndex);
            }
            this.path = meta.resources.rootPath + path;
            if (!this.format) {
                this.format = "xml";
            }
            this.load(this.path);
        }
    },
    load: function() {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.loaded = false;
        this._isAtlasLoaded = false;
        if (!this.texture) {
            this.texture = new Resource.Texture(this.path);
        } else if (typeof this.texture === "string") {
            this.texture = new Resource.Texture(this.texture);
        }
        this.texture.subscribe(this._onTextureEvent, this);
        var self = this;
        var atlasPath = this.path + "." + this.format;
        this._request = new XMLHttpRequest();
        this._request.open("GET", atlasPath, true);
        this._request.onreadystatechange = function() {
            self._onStateChange();
        };
        this._request.send();
        meta.resources.addToLoad(this);
    },
    loadData: function(data, format) {
        format = format || this.format;
        if (!format) {
            format = "xml";
        }
        this.format = format;
        var result = false;
        if (format === "xml") {
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            result = this.loadXML(xml);
        } else if (format === "json") {
            var json = JSON.parse(data);
            result = this.loadJSON(json);
        } else if (format === "plist") {
            var parser = new DOMParser();
            var plist = parser.parseFromString(data, "text/xml");
            result = this.loadPlist(plist);
        } else {
            console.warn("(Resource.SpriteSheet.loadData):", "Trying to load an unsupported format - " + this.format);
        }
        this.loaded = result;
        return result;
    },
    loadXML: function(xml) {
        if (!xml) {
            console.warn("(Resource.SpriteSheet.loadXML) Invalid XML file.");
            return false;
        }
        var childNodes = xml.documentElement.childNodes;
        var numNodes = childNodes.length;
        var node;
        for (var i = 0; i < numNodes; i++) {
            node = childNodes[i];
            if (node.nodeName === "SubTexture") {
                this._loadXML_Starling(node);
            } else if (node.nodeName === "sprite") {
                this._loadXML_genericXML(node);
            } else if (node.nodeName === "dict") {
                return this.loadPlist(xml);
            }
        }
        return true;
    },
    _loadXML_Starling: function(node) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = node.getAttribute("name");
        texture.x = node.getAttribute("x");
        texture.y = node.getAttribute("y");
        texture.resize(node.getAttribute("width"), node.getAttribute("height"));
        texture.loaded = true;
        meta.resources.add(texture);
    },
    _loadXML_genericXML: function(node) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = node.getAttribute("n");
        texture.x = node.getAttribute("x");
        texture.y = node.getAttribute("y");
        texture.resize(node.getAttribute("w"), node.getAttribute("h"));
        texture.loaded = true;
        meta.resources.add(texture);
    },
    loadPlist: function(plist) {
        if (!plist) {
            console.warn("[Resource.SpriteSheet.loadPlist]:", "Invalid Plist file.");
            return false;
        }
        var childNodes = plist.documentElement.childNodes;
        var numNodes = childNodes.length;
        var node;
        for (var i = 0; i < numNodes; i++) {
            node = childNodes[i];
            if (node.nodeName === "dict") {
                return this._loadPlist_dict(node);
            }
        }
    },
    _loadPlist_dict: function(node) {
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var command = "";
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                command = node.textContent;
            } else if (node.nodeName === "dict") {
                if (!command) {
                    continue;
                }
                if (command === "frames") {
                    this._loadPlist_frames(node);
                }
            }
        }
    },
    _loadPlist_frames: function(node) {
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var name = "";
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                name = node.textContent;
            } else if (node.nodeName === "dict") {
                this._loadPlist_frame(node, name);
            }
        }
    },
    _loadPlist_frame: function(node, name) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = name;
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var command = "", data;
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                command = node.textContent;
            } else if (node.nodeName === "string") {
                if (command === "frame") {
                    data = node.textContent.match(/[0-9]+/g);
                    texture.x = parseInt(data[0]);
                    texture.y = parseInt(data[1]);
                    texture.resize(parseInt(data[2]), parseInt(data[3]));
                    texture.loaded = true;
                    meta.resources.add(texture);
                    return;
                }
            }
        }
    },
    loadJSON: function(json) {
        if (!json) {
            console.warn("[Resource.SpriteSheet.loadFromJSON]:", "Invalid JSON file.");
            return false;
        }
        if (json.frames instanceof Array) {
            this._loadJSON_array(json);
        } else {
            this._loadJSON_hash(json);
        }
        return true;
    },
    _loadJSON_array: function(json) {
        var frame, texture;
        var frames = json.frames;
        var numFrames = frames.length;
        for (var i = 0; i < numFrames; i++) {
            frame = frames[i];
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = frame.filename;
            frame = frame.frame;
            texture.x = frame.x;
            texture.y = frame.y;
            texture.resize(frame.w, frame.h);
            texture.loaded = true;
            meta.resources.add(texture);
        }
    },
    _loadJSON_hash: function(json) {
        var frame, texture;
        var frames = json.frames;
        for (var key in frames) {
            frame = frames[key].frame;
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = key;
            texture.x = frame.x;
            texture.y = frame.y;
            texture.resize(frame.w, frame.h);
            texture.loaded = true;
            meta.resources.add(texture);
        }
    },
    loadAtlas: function() {
        if (typeof this.atlas !== "object") {
            console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "Incorrect atlas object, expected to be an Array.");
            return false;
        }
        var frames = [];
        var item, texture, name;
        var numItems = this.atlas.length;
        for (var i = 0; i < numItems; i++) {
            item = this.atlas[i];
            name = item.name || this.params;
            if (!name) {
                console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "No name defined for atlas item in " + this.name + " spritesheet.");
                continue;
            }
            item.x = item.x || this.params.x || 0;
            item.y = item.y || this.params.y || 0;
            item.width = item.width || this.params.width || 1;
            item.height = item.height || this.params.height || 1;
            frames.push(item);
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = name;
            texture.x = item.x;
            texture.y = item.y;
            texture.resize(item.width, item.height);
            texture.numFrames = item.numFrames || this.params.numFrames || 1;
            texture.loaded = true;
            meta.resources.add(texture);
        }
        this.texture._frames = frames;
        this.atlas = null;
        this.loaded = true;
        return true;
    },
    _onTextureEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            this.texture.unsubscribe(this);
            if (this._isAtlasLoaded) {
                this.loadData(this._response, this.format);
                meta.resources.loadSuccess(this);
                this._response = null;
            }
        }
    },
    _onStateChange: function() {
        if (this._request.readyState === 4) {
            if (this._request.status === 200) {
                this._isAtlasLoaded = true;
                this._response = this._request.response;
                this._request = null;
                if (this.texture._loaded) {
                    this.loadData(this._response, this.format);
                    meta.resources.loadSuccess(this);
                    this._response = null;
                }
            } else {
                this._loaded = false;
                this._request.onreadystatechange = null;
                this._request = null;
                meta.resources.loadFailed(this);
            }
        }
    },
    type: Resource.Type.SPRITE_SHEET,
    format: "",
    atlas: null,
    params: null,
    texture: null,
    _request: null,
    _response: null,
    _isAtlasLoaded: false
});

"use strict";

meta.class("Resource.Font", "Resource.Basic", {
    onInit: function(path, tag) {
        if (path) {
            this.load(meta.resources.rootPath + path);
        }
    },
    load: function(path) {
        if (this.loading) {
            return;
        }
        this.loaded = false;
        if (!path) {
            return;
        }
        this.path = path;
        var wildCardIndex = this.path.lastIndexOf(".");
        if (wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
            this.path += ".fnt";
            this.format = "fnt";
        } else {
            this.format = this.path.substr(wildCardIndex + 1);
        }
        var parseFunc = this["parse_" + this.format];
        if (!parseFunc) {
            console.warn("(Resource.Font.load) Unsupported format: " + this.format);
            return;
        }
        this.chars = new Array(256);
        meta.resources.addToLoad(this);
        this.texture = new Resource.Texture(path);
        this.texture.subscribe(this._onTextureEvent, this);
        var self = this;
        meta.ajax({
            url: this.path,
            success: function(data) {
                parseFunc.call(self, data);
            },
            error: function() {
                self._onError();
            }
        });
    },
    _onError: function() {
        meta.resources.loadFailed(this);
    },
    parse_fnt: function(data) {
        this.tokenizer.setup(data);
        this.tokenizer.nextToken();
        while (this.tokenizer.token.type !== 0) {
            this._parseToken_fnt();
        }
        var currChar;
        for (var key in this.chars) {
            currChar = this.chars[key];
            if (currChar.offsetY > this._minOffsetY) {
                currChar.offsetY -= this._minOffsetY;
            }
        }
        this._loadedFormat = true;
        if (this.texture._loaded) {
            meta.resources.loadSuccess(this);
            this.loaded = true;
        }
    },
    _parseToken_fnt: function() {
        var token = this.tokenizer.token;
        var line = token.line;
        switch (token.str) {
          case "char":
            {
                var rect = new this.Rect();
                for (;;) {
                    token = this.tokenizer.nextToken();
                    if (token.line !== line) {
                        break;
                    }
                    switch (token.str) {
                      case "id":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        this.chars[token.value] = rect;
                        break;

                      case "x":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        rect.x = token.value;
                        break;

                      case "y":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        rect.y = token.value;
                        break;

                      case "yoffset":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        rect.offsetY = token.value;
                        if (token.value < this._minOffsetY && token.value !== 0) {
                            this._minOffsetY = token.value;
                        }
                        break;

                      case "width":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        rect.width = token.value;
                        break;

                      case "height":
                        {
                            this.tokenizer.nextToken();
                            token = this.tokenizer.nextToken();
                            rect.height = token.value;
                            if (this.height < token.value) {
                                this.height = token.value;
                            }
                        }
                        break;

                      case "xadvance":
                        this.tokenizer.nextToken();
                        token = this.tokenizer.nextToken();
                        rect.kerning = token.value;
                        break;
                    }
                }
            }
            break;

          default:
            this.tokenizer.nextToken();
            break;
        }
    },
    _onTextureEvent: function(data, event) {
        switch (event) {
          case Resource.Event.LOADED:
            {
                if (this._loadedFormat) {
                    meta.resources.loadSuccess(this);
                    this.loaded = true;
                }
            }
            break;

          case Resource.Event.FAILED:
            {}
            break;
        }
    },
    Rect: function() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.kerning = 0;
        this.offsetY = 0;
    },
    tokenizer: meta.tokenizer,
    type: Resource.Type.FONT,
    format: "",
    texture: null,
    chars: null,
    height: 1,
    _loadedFormat: false,
    _minOffsetY: Number.MAX_VALUE
});

"use strict";

meta.class("Resource.SVG", "Resource.Texture", {
    fillRect: function(x, y, width, height) {
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            this.resizeSilently(width + x, height + y);
        }
        this.ctx.fillStyle = this._fillStyle;
        this.ctx.fillRect(x, y, width, height);
        this.loaded = true;
    },
    line: function(x1, y1, x2, y2) {
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            var minX, maxX, minY, maxY;
            if (x1 < x2) {
                minX = x1;
                maxX = x2;
            } else {
                minX = x2;
                maxX = x1;
            }
            if (y1 < y2) {
                minY = y1;
                maxY = y2;
            } else {
                minY = y2;
                maxY = y1;
            }
            this.resizeSilently(maxX, maxY);
        }
        this.ctx.strokeStyle = this._strokeStyle;
        this.ctx.lineWidth = this._lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.loaded = true;
    },
    rect: function(x, y, width, height) {
        var offset;
        if (this._lineWidth % 2 === 1) {
            offset = .5;
        } else {
            offset = 0;
        }
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            if (offset) {
                this.resizeSilently(width + x + 1, height + y + 1);
            } else {
                this.resizeSilently(width + x, height + y);
            }
        }
        this.ctx.save();
        this.ctx.translate(offset, offset);
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        if (this._fillStyle) {
            this.ctx.fillStyle = this._fillStyle;
            this.ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            this.ctx.lineWidth = this._lineWidth;
            this.ctx.strokeStyle = this._strokeStyle;
            this.ctx.stroke();
        }
        this.ctx.restore();
        this.loaded = true;
    },
    circle: function(radius) {
        var offset;
        if (!this._strokeStyle) {
            if (!this._fillStyle) {
                this._fillStyle = "#000";
            }
            offset = 0;
        } else {
            offset = this._lineWidth;
        }
        var size = (radius + offset) * 2;
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            this.resizeSilently(size, size);
        }
        this.ctx.beginPath();
        this.ctx.arc(radius + offset, radius + offset, radius, 0, Math.PI * 2, false);
        this.ctx.closePath();
        if (this._fillStyle) {
            this.ctx.fillStyle = this._fillStyle;
            this.ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            this.ctx.lineWidth = this._lineWidth;
            this.ctx.strokeStyle = this._strokeStyle;
            this.ctx.stroke();
        }
        this.loaded = true;
    },
    tileAuto: function(texture, center, offsetX, offsetY) {
        if (typeof texture === "string") {
            var newTexture = meta.resources.getTexture(texture);
            if (!newTexture) {
                console.warn("(Resource.Texture.tileAuto): Could not get texture with name: " + texture);
                return;
            }
            texture = newTexture;
        } else if (!texture) {
            console.warn("(Resource.Texture.tileAuto): Invalid texture");
            return;
        }
        if (!texture._loaded) {
            this.loaded = false;
            var self = this;
            texture.subscribe(function(data, event) {
                self.tileAuto(texture, center, offsetX, offsetY);
            }, this);
            return;
        }
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        var numX = Math.ceil(this.fullWidth / texture.fullWidth) || 1;
        var numY = Math.ceil(this.fullHeight / texture.fullHeight) || 1;
        var textureWidth = numX * (texture.fullWidth + offsetX) + offsetX;
        var textureHeight = numY * (texture.fullHeight + offsetY) + offsetY;
        var textureOffsetX = offsetX;
        var textureOffsetY = offsetY;
        if (center) {
            textureOffsetX = -(textureWidth - this.fullWidth) * .5;
            textureOffsetY = -(textureHeight - this.fullHeight) * .5;
        }
        var posX = textureOffsetX;
        var posY = textureOffsetY;
        for (var x = 0; x < numX; x++) {
            for (var y = 0; y < numY; y++) {
                this.ctx.drawImage(texture.canvas, posX, posY);
                posY += texture.trueHeight + offsetY;
            }
            posX += texture.trueWidth + offsetX;
            posY = textureOffsetY;
        }
        this.loaded = true;
    },
    tile: function(texture, numX, numY, offsetX, offsetY) {
        if (typeof texture === "string") {
            var newTexture = meta.resources.getTexture(texture);
            if (!newTexture) {
                console.warn("(Resource.Texture.tile): Could not get texture with name: " + texture);
                return;
            }
            texture = newTexture;
        } else if (!texture) {
            console.warn("(Resource.Texture.tile): Invalid texture");
            return;
        }
        if (!texture._loaded) {
            this.loaded = false;
            var self = this;
            texture.subscribe(function(data, event) {
                self.tile(data, numX, numY, offsetX, offsetY);
            }, this);
            return;
        }
        var textureWidth = numX * (texture.fullWidth + offsetX) + offsetX;
        var textureHeight = numY * (texture.fullHeight + offsetY) + offsetY;
        this.resizeSilently(textureWidth, textureHeight);
        var textureOffsetX = offsetX;
        var textureOffsetY = offsetY;
        var posX = textureOffsetX;
        var posY = textureOffsetY;
        for (var x = 0; x < numX; x++) {
            for (var y = 0; y < numY; y++) {
                this.ctx.drawImage(texture.canvas, posX, posY);
                posY += texture.trueHeight + offsetY;
            }
            posX += texture.trueWidth + offsetX;
            posY = textureOffsetY;
        }
        this.loaded = true;
    },
    shape: function(buffer) {
        var scope = meta;
        var unitSize = 1;
        var minX = Number.POSITIVE_INFINITY, minY = minX, maxX = Number.NEGATIVE_INFINITY, maxY = maxX;
        var item, i, x, y;
        var numItems = buffer.length;
        for (i = 0; i < numItems; i += 2) {
            x = buffer[i] * unitSize | 0;
            y = buffer[i + 1] * unitSize | 0;
            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            buffer[i] = x;
            buffer[i + 1] = y;
        }
        if (minX > 0) {
            minX = 0;
        }
        if (minY > 0) {
            minY = 0;
        }
        var ctx = this.ctx;
        var halfLineWidth = this._lineWidth / 2;
        var offsetX = -minX + halfLineWidth;
        var offsetY = -minY + halfLineWidth;
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            this.resizeSilently(maxX - minX + this._lineWidth, maxY - minY + this._lineWidth);
        }
        ctx.lineWidth = this._lineWidth;
        if (this._lineCap) {
            ctx.lineCap = this._lineCap;
        }
        if (this._lineDash) {
            ctx.setLineDash(this._lineDash);
        }
        ctx.beginPath();
        ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
        for (i = 2; i < numItems; i += 2) {
            ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
        }
        if (this.closePath) {
            ctx.closePath();
        }
        if (this._fillStyle) {
            this.ctx.fillStyle = this._fillStyle;
            this.ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            this.ctx.lineWidth = this._lineWidth;
            this.ctx.strokeStyle = this._strokeStyle;
            this.ctx.stroke();
        }
        this.loaded = true;
    },
    arc: function(radius, startAngle, endAngle, counterClockwise) {
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            var size = (radius + this._lineWidth) * 2;
            this.resizeSilently(size, size);
        }
        this.ctx.beginPath();
        this.ctx.arc(radius + this._lineWidth, radius + this._lineWidth, radius, startAngle, endAngle, false);
        if (this.closePath) {
            this.ctx.closePath();
        }
        if (this._fillStyle) {
            this.ctx.fillStyle = this._fillStyle;
            this.ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            this.ctx.lineWidth = this._lineWidth;
            this.ctx.strokeStyle = this._strokeStyle;
            this.ctx.stroke();
        }
        this.loaded = true;
    },
    roundRect: function(width, height, radius) {
        var offset;
        if (this._lineWidth % 2 === 1) {
            offset = .5;
        } else {
            offset = 0;
        }
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            if (offset) {
                this.resizeSilently(width + 1, height + 1);
            } else {
                this.resizeSilently(width, height);
            }
        }
        var halfWidth = Math.ceil(this._lineWidth / 2);
        this.ctx.save();
        this.ctx.translate(offset, offset);
        this.ctx.beginPath();
        this.ctx.moveTo(halfWidth + radius, halfWidth);
        this.ctx.lineTo(width - halfWidth - radius, halfWidth);
        this.ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
        this.ctx.lineTo(width - halfWidth, height - halfWidth - radius);
        this.ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
        this.ctx.lineTo(halfWidth + radius, height - halfWidth);
        this.ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
        this.ctx.lineTo(halfWidth, radius + halfWidth);
        this.ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
        this.ctx.closePath();
        if (this._fillStyle) {
            this.ctx.fillStyle = this._fillStyle;
            this.ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            this.ctx.lineWidth = this._lineWidth;
            this.ctx.strokeStyle = this._strokeStyle;
            this.ctx.stroke();
        }
        this.ctx.restore();
        this.loaded = true;
    },
    gradient: function(buffer) {
        var gradient = this.ctx.createLinearGradient(0, 0, 0, this.fullHeight);
        var numStops = buffer.length;
        for (var n = 0; n < numStops; n += 2) {
            gradient.addColorStop(buffer[n], buffer[n + 1]);
        }
        this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.fullWidth, this.fullHeight);
        this.loaded = true;
    },
    grid: function(numX, numY, sizeX, sizeY) {
        var width = numX * sizeX;
        var height = numY * sizeY;
        if ((this.flags & this.TextureFlag.RESIZED) === 0) {
            this.resizeSilently(width + this.lineWidth, height + this.lineWidth);
        }
        this.ctx.strokeStyle = this.strokeStyle;
        this.ctx.lineWidth = this.lineWidth;
        var lineOffset = this.lineWidth * .5;
        this.ctx.save();
        this.ctx.translate(lineOffset, lineOffset);
        var offset = 0;
        for (var x = 0; x <= numX; x++) {
            this.ctx.moveTo(offset, 0);
            this.ctx.lineTo(offset, height);
            offset += sizeX;
        }
        offset = 0;
        for (var y = 0; y <= numY; y++) {
            this.ctx.moveTo(-lineOffset, offset);
            this.ctx.lineTo(width + lineOffset, offset);
            offset += sizeY;
        }
        this.ctx.stroke();
        this.ctx.restore();
        this.loaded = true;
    },
    set lineWidth(value) {
        this._lineWidth = value;
    },
    get lineWidth() {
        return this._lineWidth;
    },
    set fillStyle(hex) {
        this._fillStyle = hex;
    },
    get fillStyle() {
        return this._fillStyle;
    },
    set strokeStyle(hex) {
        this._strokeStyle = hex;
    },
    get strokeStyle() {
        return this._strokeStyle;
    },
    Cache: function(name, data) {
        this.name = name;
        this.data = data;
    },
    _lineWidth: 2,
    _lineCap: "",
    _lineDash: "",
    _fillStyle: "",
    _strokeStyle: "",
    closePath: false
});

"use strict";

var Input = {
    BUTTON_ENUM_OFFSET: 2e3
};

Input.Event = {
    DOWN: "inputDown",
    UP: "inputUp",
    MOVE: "inputMove",
    CLICK: "inputClick",
    DBCLICK: "inputDbClick"
};

Input.Key = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46,
    NUM_0: 48,
    NUM_1: 49,
    NUM_2: 50,
    NUM_3: 51,
    NUM_4: 52,
    NUM_5: 53,
    NUM_6: 54,
    NUM_7: 55,
    NUM_8: 56,
    NUM_9: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    SQUARE_BRACKET_LEFT: 91,
    SQUARE_BRACKET_RIGHT: 91,
    PARENTHESES_LEFT: 91,
    PARENTHESES_RIGHT: 91,
    BRACES_LEFT: 91,
    BRACES_RIGHT: 92,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    PLUS: 187,
    MINUS: 189,
    TILDE: 192,
    APOSTROPHE: 222,
    BUTTON_LEFT: 0 + Input.BUTTON_ENUM_OFFSET,
    BUTTON_MIDDLE: 1 + Input.BUTTON_ENUM_OFFSET,
    BUTTON_RIGHT: 2 + Input.BUTTON_ENUM_OFFSET
};

"use strict";

meta.class("Input.Manager", {
    init: function() {
        var numTotalKeys = this.numKeys + this.numInputs + 1;
        this.keys = new Array(numTotalKeys);
        this.touches = [];
        this.pressed = {};
        this.keybind = {};
        this._event = {
            event: null,
            type: "",
            x: 0,
            y: 0,
            prevScreenX: 0,
            prevScreenY: 0,
            screenX: 0,
            screenY: 0,
            keyCode: 0,
            entity: null
        };
        this._addEventListeners();
        this._loadIgnoreKeys();
        meta.engine.onBlur.add(this.resetInput, this);
        this.keyID = new Array(numTotalKeys);
        var keyEnum = Input.Key;
        for (var key in keyEnum) {
            this.keyID[keyEnum[key]] = key;
        }
    },
    _addEventListeners: function() {
        this.onDown = meta.createChannel(Input.Event.DOWN);
        this.onUp = meta.createChannel(Input.Event.UP);
        this.onMove = meta.createChannel(Input.Event.MOVE);
        this.onClick = meta.createChannel(Input.Event.CLICK);
        this.onDbClick = meta.createChannel(Input.Event.DBCLICK);
        var self = this;
        window.addEventListener("mousedown", function(event) {
            self.handleMouseDown(event);
        });
        window.addEventListener("mouseup", function(event) {
            self.handleMouseUp(event);
        });
        window.addEventListener("mousemove", function(event) {
            self.handleMouseMove(event);
        });
        window.addEventListener("dblclick", function(event) {
            self.handleMouseDbClick(event);
        });
        window.addEventListener("touchstart", function(event) {
            self.handleTouchDown(event);
        });
        window.addEventListener("touchend", function(event) {
            self.handleTouchUp(event);
        });
        window.addEventListener("touchmove", function(event) {
            self.handleTouchMove(event);
        });
        window.addEventListener("touchcancel", function(event) {
            self.handleTouchUp(event);
        });
        window.addEventListener("touchleave", function(event) {
            self.handleTouchUp(event);
        });
        if (meta.device.support.onkeydown) {
            window.addEventListener("keydown", function(event) {
                self.handleKeyDown(event);
            });
        }
        if (meta.device.support.onkeyup) {
            window.addEventListener("keyup", function(event) {
                self.handleKeyUp(event);
            });
        }
    },
    handleKeyDown: function(event) {
        var keyCode = event.keyCode;
        if (document.activeElement === document.body) {
            if (window.top && this._iframeKeys[keyCode]) {
                event.preventDefault();
            }
            if (this._cmdKeys[keyCode] !== void 0) {
                this._numCmdKeys++;
            }
            if (this._ignoreKeys[keyCode] !== void 0 && this._numCmdKeys <= 0) {
                event.preventDefault();
            }
        }
        if (this.blockInput) {
            return;
        }
        if (this.stickyKeys && this.keys[keyCode]) {
            return;
        }
        if (event.keyIdentifier === "Meta") {
            this.metaPressed = true;
        } else if (this.metaPressed) {
            return;
        }
        this.keys[keyCode] = 1;
        this.pressed[this.keyID[keyCode]] = 1;
        if (this._keybindMap && this._keybindMap[keyCode]) {
            var buffer = this._keybindMap[keyCode];
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                this.keybind[buffer[n]] = 1;
            }
        }
        this._event.event = event;
        this._event.prevScreenX = 0;
        this._event.prevScreenY = 0;
        this._event.screenX = 0;
        this._event.screenY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = keyCode;
        this.onDown.emit(this._event, Input.Event.DOWN);
        if (this.keyRepeat) {
            if (!this._inputTimer) {
                var self = this;
                this._inputTimer = meta.addTimer(this, function() {
                    self._event.keyCode = self._repeatKey;
                    self.onDown.emit(self._event, Input.Event.DOWN);
                }, this.keyRepeat);
            }
            this._repeatKey = keyCode;
            this._inputTimer.resume();
            this._inputTimer.tAccumulator = 0;
        }
    },
    handleKeyUp: function(event) {
        var keyCode = event.keyCode;
        if (document.activeElement === document.body) {
            if (window.top && this._iframeKeys[keyCode]) {
                event.preventDefault();
            }
            if (this._cmdKeys[keyCode] !== void 0 && this.keys[keyCode]) {
                this._numCmdKeys--;
            }
            if (this._ignoreKeys[keyCode] === void 0 && this._numCmdKeys <= 0) {
                event.preventDefault();
            }
        }
        if (this.blockInput) {
            return;
        }
        this.metaPressed = false;
        this.keys[keyCode] = 0;
        this.pressed[this.keyID[keyCode]] = 0;
        if (this._keybindMap && this._keybindMap[keyCode]) {
            var buffer = this._keybindMap[keyCode];
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                this.keybind[buffer[n]] = 0;
            }
        }
        this._event.event = event;
        this._event.prevScreenX = 0;
        this._event.prevScreenY = 0;
        this._event.prevX = 0;
        this._event.prevY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = keyCode;
        this.onUp.emit(this._event, Input.Event.UP);
        if (this.keyRepeat && this._inputTimer) {
            this._inputTimer.pause();
        }
    },
    handleMouseDown: function(event) {
        if (this.blockInput) {
            return;
        }
        var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
        this.keys[keyCode] = 1;
        this.pressed[this.keyID[keyCode]] = keyCode;
        if (this._keybindMap && this._keybindMap[keyCode]) {
            var buffer = this._keybindMap[keyCode];
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                this.keybind[buffer[n]] = 1;
            }
        }
        var scope = meta;
        var camera = scope.camera;
        this.prevScreenX = this.screenX;
        this.prevScreenY = this.screenX;
        this.screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
        this.screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
        this.x = this.screenX * camera.zoomRatio + camera.volume.x | 0;
        this.y = this.screenY * camera.zoomRatio + camera.volume.y | 0;
        this._event.event = event;
        this._event.prevScreenX = this.prevScreenX;
        this._event.prevScreenY = this.prevScreenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.x;
        this._event.y = this.y;
        this._event.keyCode = keyCode;
        this.onDown.emit(this._event, Input.Event.DOWN);
        this._event.entity = null;
    },
    handleMouseUp: function(event) {
        if (this.blockInput) {
            return;
        }
        var keyCode = event.button + Input.BUTTON_ENUM_OFFSET;
        this.keys[keyCode] = 0;
        this.pressed[this.keyID[keyCode]] = 0;
        if (this._keybindMap && this._keybindMap[keyCode]) {
            var buffer = this._keybindMap[keyCode];
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                this.keybind[buffer[n]] = 0;
            }
        }
        var scope = meta;
        var camera = scope.camera;
        this.prevScreenX = this.screenX;
        this.prevScreenY = this.screenY;
        this.screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
        this.screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
        this.x = this.screenX * camera.zoomRatio + camera.volume.x | 0;
        this.y = this.screenY * camera.zoomRatio + camera.volume.y | 0;
        this._event.event = event;
        this._event.prevScreenX = this.prevScreenX;
        this._event.prevScreenY = this.prevScreenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.x;
        this._event.y = this.y;
        this._event.keyCode = keyCode;
        this.onUp.emit(this._event, Input.Event.UP);
        this.onClick.emit(this._event, Input.Event.CLICK);
        this._event.entity = null;
    },
    handleMouseMove: function(event) {
        if (document.activeElement === document.body) {
            event.preventDefault();
        }
        if (this.blockInput) {
            return;
        }
        var scope = meta;
        var camera = scope.camera;
        this.prevScreenX = this.screenX;
        this.prevScreenY = this.screenY;
        this.screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
        this.screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
        this.x = this.screenX * camera.zoomRatio + camera.volume.x | 0;
        this.y = this.screenY * camera.zoomRatio + camera.volume.y | 0;
        this._event.event = event;
        this._event.prevScreenX = this.prevScreenX;
        this._event.prevScreenY = this.prevScreenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.x;
        this._event.y = this.y;
        this._event.keyCode = -1;
        this.onMove.emit(this._event, Input.Event.MOVE);
        this._event.entity = null;
    },
    handleMouseDbClick: function(event) {
        if (this.blockInput) {
            return;
        }
        var keyCode = event.button;
        this.keys[keyCode] = 0;
        this.pressed[this.keyID[keyCode]] = 0;
        if (this._keybindMap && this._keybindMap[keyCode]) {
            var buffer = this._keybindMap[keyCode];
            var num = buffer.length;
            for (var n = 0; n < num; n++) {
                this.keybind[buffer[n]] = 0;
            }
        }
        var scope = meta;
        var camera = scope.camera;
        this.prevScreenX = this.screenX;
        this.prevScreenY = this.screenY;
        this.screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
        this.screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
        this.x = this.screenX * camera.zoomRatio + camera.volume.x | 0;
        this.y = this.screenY * camera.zoomRatio + camera.volume.y | 0;
        this._event.event = event;
        this._event.prevScreenX = this.prevScreenX;
        this._event.prevScreenY = this.prevScreenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.x;
        this._event.y = this.y;
        this._event.keyCode = keyCode;
        this.onDbClick.emit(this._event, Input.Event.DBCLICK);
        if (this._onUpCBS && this._onUpCBS[keyCode]) {
            var cbs = this._onUpCBS[keyCode];
            var numCbs = cbs.length;
            for (var i = 0; i < numCbs; i++) {
                cbs[i](this._event, Input.Event.UP);
            }
        }
        this._event.entity = null;
    },
    handleTouchDown: function(event) {
        if (document.activeElement === document.body) {
            event.preventDefault();
        }
        var scope = meta;
        var camera = scope.camera;
        var touch, screenX, screenY, x, y, id;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            id = this.touches.length - 1;
            touch = event.changedTouches[i];
            this.touches.push(touch.identifier);
            this.numTouches++;
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
            x = screenX * camera.zoomRatio + camera.volume.x | 0;
            y = screenY * camera.zoomRatio + camera.volume.y | 0;
            var keyCode = id + Input.BUTTON_ENUM_OFFSET;
            this.keys[keyCode] = 1;
            if (id < 3) {
                this.pressed[this.keyID[keyCode]] = 1;
                if (this._keybindMap && this._keybindMap[keyCode]) {
                    var buffer = this._keybindMap[keyCode];
                    var num = buffer.length;
                    for (var n = 0; n < num; n++) {
                        this.keybind[buffer[n]] = 1;
                    }
                }
            }
            this._event.event = event;
            this._event.prevScreenX = screenX;
            this._event.prevScreenY = screenY;
            this._event.screenX = screenX;
            this._event.screenY = screenY;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = keyCode;
            if (id === 0) {
                this.screenX = screenX;
                this.screenY = screenY;
                this.x = x;
                this.y = y;
            }
            this.onDown.emit(this._event, Input.Event.DOWN);
            this._event.entity = null;
        }
    },
    handleTouchUp: function(event) {
        if (document.activeElement === document.body) {
            event.preventDefault();
        }
        var scope = meta;
        var camera = scope.camera;
        var touch, id, screenX, screenY, x, y;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            touch = event.changedTouches[i];
            id = this._getTouchID(touch.identifier);
            if (id === -1) {
                continue;
            }
            this.touches.splice(id, 1);
            this.numTouches--;
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
            x = screenX * camera.zoomRatio + camera.volume.x | 0;
            y = screenY * camera.zoomRatio + camera.volume.y | 0;
            var keyCode = id + Input.BUTTON_ENUM_OFFSET;
            this.keys[keyCode] = 0;
            if (id < 3) {
                this.pressed[this.keyID[keyCode]] = 0;
                if (this._keybindMap && this._keybindMap[keyCode]) {
                    var buffer = this._keybindMap[keyCode];
                    var num = buffer.length;
                    for (var n = 0; n < num; n++) {
                        this.keybind[buffer[n]] = 0;
                    }
                }
            }
            this._event.event = event;
            if (id === 0) {
                this.prevScreenX = this.screenX;
                this.prevScreenY = this.screenY;
                this.screenX = screenX;
                this.screenY = screenY;
                this.x = x;
                this.y = y;
                this._event.prevScreenX = this.prevScreenX;
                this._event.prevScreenY = this.prevScreenY;
            } else {
                this._event.prevScreenX = 0;
                this._event.prevScreenY = 0;
            }
            this._event.screenX = screenX;
            this._event.screenY = screenY;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = id;
            this.onDown.emit(this._event, Input.Event.UP);
            this.onClick.emit(this._event, Input.Event.CLICK);
            this._event.entity = null;
        }
    },
    handleTouchMove: function(event) {
        if (document.activeElement === document.body) {
            event.preventDefault();
        }
        var scope = meta;
        var camera = scope.camera;
        var touch, id, screenX, screenY, x, y;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            touch = event.changedTouches[i];
            id = this._getTouchID(touch.identifier);
            if (id === -1) {
                continue;
            }
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * this.engine.ratio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * this.engine.ratio;
            x = screenX * camera.zoomRatio + camera.volume.x | 0;
            y = screenY * camera.zoomRatio + camera.volume.y | 0;
            var keyCode = id + Input.BUTTON_ENUM_OFFSET;
            this._event.event = event;
            if (id === 0) {
                this.prevScreenX = this.screenX;
                this.prevScreenY = this.screenY;
                this.screenX = screenX;
                this.screenY = screenY;
                this.x = x;
                this.y = y;
                this._event.prevScreenX = this.prevScreenX;
                this._event.prevScreenY = this.prevScreenY;
            } else {
                this._event.prevScreenX = screenX;
                this._event.prevScreenY = screenY;
            }
            this._event.screenX = 0;
            this._event.screenY = 0;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = keyCode;
            this.onMove.emit(this._event, Input.Event.MOVE);
            this._event.entity = null;
        }
    },
    resetInput: function() {
        var i;
        this._event.event = null;
        this._event.prevX = 0;
        this._event.prevY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = 0;
        this.metaPressed = false;
        var numTotalKeys = this.numKeys + this.numInputs;
        for (i = 0; i < this.numTotalKeys; i++) {
            if (this.keys[i]) {
                this.keys[i] = 0;
                this._event.keyCode = i;
                this.onKeyUp.emit(this._event, Input.Event.UP);
            }
        }
        this.pressed = {};
        this.keybind = {};
        this._numCmdKeys = 0;
        if (this.numTouches) {
            for (i = 0; i < this.numTouches; i++) {
                this._event.keyCode = i;
                this.onUp.emit(this._event, Input.Event.UP);
            }
            this.touches.length = 0;
            this.numTouches = 0;
        }
    },
    getEvent: function() {
        this._event.event = null;
        this._event.prevScreenX = this.prevScreenX;
        this._event.prevScreenY = this.prevScreenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.inputX;
        this._event.y = this.inputY;
        this._event.keyCode = -1;
        return this._event;
    },
    _loadIgnoreKeys: function() {
        this._ignoreKeys = [];
        this._ignoreKeys[8] = 1;
        this._ignoreKeys[9] = 1;
        this._ignoreKeys[13] = 1;
        this._ignoreKeys[17] = 1;
        this._ignoreKeys[91] = 1;
        this._ignoreKeys[38] = 1;
        this._ignoreKeys[39] = 1;
        this._ignoreKeys[40] = 1;
        this._ignoreKeys[37] = 1;
        this._ignoreKeys[124] = 1;
        this._ignoreKeys[125] = 1;
        this._ignoreKeys[126] = 1;
        this._cmdKeys = [];
        this._cmdKeys[91] = 1;
        this._cmdKeys[17] = 1;
        this._iframeKeys = [];
        this._iframeKeys[37] = 1;
        this._iframeKeys[38] = 1;
        this._iframeKeys[39] = 1;
        this._iframeKeys[40] = 1;
    },
    _ignoreFKeys: function(value) {
        this._ignoreKeys[112] = value;
        this._ignoreKeys[113] = value;
        this._ignoreKeys[114] = value;
        this._ignoreKeys[115] = value;
        this._ignoreKeys[116] = value;
        this._ignoreKeys[117] = value;
        this._ignoreKeys[118] = value;
        this._ignoreKeys[119] = value;
        this._ignoreKeys[120] = value;
        this._ignoreKeys[121] = value;
        this._ignoreKeys[122] = value;
        this._ignoreKeys[123] = value;
    },
    set ignoreFKeys(flag) {
        if (flag) {
            this._ignoreFKeys(1);
        } else {
            this._ignoreFKeys(0);
        }
    },
    get ignoreFKeys() {
        return !!this._ignoreKeys[112];
    },
    _getTouchID: function(eventTouchID) {
        for (var i = 0; i < this.numTouches; i++) {
            if (this.touches[i] === eventTouchID) {
                return i;
            }
        }
        return -1;
    },
    addKeybind: function(keybind, keys) {
        if (!this._keybindMap) {
            this._keybindMap = new Array(this.numKeys + this.numInputs + 1);
        }
        var key;
        var numKeys = keys.length;
        for (var n = 0; n < numKeys; n++) {
            key = keys[n];
            if (!this._keybindMap[key]) {
                this._keybindMap[key] = [ keybind ];
            } else {
                this._keybindMap[key].push(keybind);
            }
        }
    },
    isDown: function(key) {
        return this.keys[key];
    },
    isUp: function(key) {
        return !this.keys[key];
    },
    onDown: null,
    onUp: null,
    onMove: null,
    onClick: null,
    onDbClick: null,
    engine: meta.engine,
    keyID: null,
    keys: null,
    touches: null,
    pressed: null,
    keybind: null,
    _keybindMap: null,
    blockInput: false,
    stickyKeys: true,
    metaPressed: false,
    keyRepeat: 0,
    _inputTimer: null,
    _repeatKey: 0,
    numKeys: 256,
    numInputs: 10,
    numTouches: 0,
    x: 0,
    y: 0,
    screenX: 0,
    screenY: 0,
    prevScreenX: 0,
    prevScreenY: 0,
    _event: null,
    _ignoreKeys: null,
    _cmdKeys: null,
    _iframeKeys: null,
    _numCmdKeys: 0
});

"use strict";

var Entity = {};

Entity.Event = {
    INPUT_UP: "entityUp",
    INPUT_DOWN: "entityDown",
    CLICK: "entityClick",
    DBCLICK: "entityDbClick",
    DRAG: "drag",
    DRAG_START: "dragStart",
    DRAG_END: "dragEnd",
    HOVER: "hover",
    HOVER_ENTER: "hoverEnter",
    HOVER_EXIT: "hoverExit",
    STATE_CHANGE: "stateChange"
};

"use strict";

meta.class("Entity.Geometry", {
    init: function(arg) {
        this.volume = new meta.math.AABBext();
        this.anim = new Component.Anim(this);
        this.initArg(arg);
        if (this.onCreate) {
            this.onCreate(arg);
        }
    },
    initArg: function(arg) {
        if (typeof arg === "object") {
            if (arg instanceof Resource.Texture) {
                this.texture = arg;
            } else {
                for (var key in arg) {
                    this[key] = arg[key];
                }
            }
        } else if (typeof arg === "string") {
            this.texture = arg;
        }
    },
    onCreate: null,
    set enabled(value) {
        if (value) {
            if (this.flags & this.Flag.ENABLED) {
                return;
            }
            this.flags |= this.Flag.ENABLED;
        } else {
            if ((this.flags & this.Flag.ENABLED) === 0) {
                return;
            }
            this.flags &= ~this.Flag.ENABLED;
        }
        this._updateEnabled(true);
    },
    get enabled() {
        return (this.flags & this.Flag.ENABLED) === this.Flag.ENABLED;
    },
    _updateEnabled: function(parent) {
        if (this.flags & this.Flag.INSTANCE_ENABLED) {
            if (this.flags & this.Flag.ENABLED && this.parent.flags & this.Flag.INSTANCE_ENABLED) {
                return;
            }
            this.flags &= ~this.Flag.INSTANCE_ENABLED;
        } else {
            if (this.flags & this.Flag.ENABLED && this.parent.flags & this.Flag.INSTANCE_ENABLED) {
                this.flags |= this.Flag.INSTANCE_ENABLED;
            } else {
                return;
            }
        }
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._updateEnabled(false);
            }
        }
        if (this._view && parent) {
            this._view.updateEntity(this);
        }
    },
    _activate: function() {
        this.flags |= this.Flag.ACTIVE;
        if (this.flags & this.Flag.UPDATING) {
            this.updating = true;
        }
        if (this.flags & this.Flag.PICKING) {
            this.picking = true;
        }
        this._updateAnchor();
        if (this.renderer.culling) {
            this.node = new meta.SparseNode(this);
        }
        if (this.components !== this.parent.components) {
            var component;
            for (var key in this.components) {
                component = this.components[key];
                if (component.onActiveEnter) {
                    component.onActiveEnter();
                }
            }
        }
    },
    _deactivate: function() {
        this.flags &= ~this.Flag.ACTIVE;
        if (this.components !== this.parent.components) {
            var component;
            for (var key in this.components) {
                component = this.components[key];
                if (component.onActiveExit) {
                    component.onActiveExit();
                }
            }
        }
    },
    remove: function() {
        if (this.flags & this.Flag.REMOVED) {
            return;
        }
        this.flags |= this.Flag.REMOVED;
        if (this.flags & this.Flag.ACTIVE) {
            this.renderer.removeEntity(this);
        } else {
            this._remove();
        }
    },
    _remove: function() {
        if (this._texture) {
            this._texture.unsubscribe(this);
            this._texture = null;
        }
        if (this.tween) {
            this.tween.clear();
        }
        if (this.view) {
            this.view.detach(this);
        }
        this.onInactive();
        if (this.onRemove) {
            this.onRemove();
        }
    },
    onRemove: null,
    update: null,
    draw: null,
    updatePos: function() {
        this.volume.x = this._x + this.totalOffsetX;
        this.volume.y = this._y + this.totalOffsetY;
        this.volume.updatePos();
        if (this.node) {
            this.renderer.culling.update(this);
        }
        if (this.children) {
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                if (child.flags & this.Flag.IGNORE_PARENT_POS) {
                    continue;
                }
                child._parentX = this.volume.x - this.volume.pivotPosX - this.offsetPosX;
                child._parentY = this.volume.y - this.volume.pivotPosY - this.offsetPosY;
                child.updateTotalOffset();
            }
        }
        this.renderer.needRender = true;
    },
    updateTotalOffset: function() {
        this.totalOffsetX = this.offsetPosX + this._parentX + this.anchorPosX;
        this.totalOffsetY = this.offsetPosY + this._parentY + this.anchorPosY;
        if (this._view) {
            this.totalOffsetX += this._view._x;
            this.totalOffsetY += this._view._y;
        }
        this.updatePos();
    },
    position: function(x, y) {
        if (this._x === x && this._y === y) {
            return;
        }
        this._x = x;
        this._y = y;
        this.updatePos();
    },
    move: function(x, y) {
        if (x === 0 && y === 0) {
            return;
        }
        this._x += x;
        this._y += y;
        this.updatePos();
    },
    moveForward: function(delta) {
        var newX = this._x + delta * Math.cos(this.volume.angle - 1.57079);
        var newY = this._y + delta * Math.sin(this.volume.angle - 1.57079);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this._x = newX;
        this._y = newY;
        this.updatePos();
    },
    moveDirected: function(delta, angleOffset) {
        var newX = this._x + -delta * Math.cos(this.volume.angle - 1.57079 + angleOffset);
        var newY = this._y + -delta * Math.sin(this.volume.angle - 1.57079 + angleOffset);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this._x = newX;
        this._y = newY;
        this.updatePos();
    },
    strafe: function(delta) {
        var newX = this._x + -delta * Math.cos(this._angleRad + Math.PI);
        var newY = this._y + -delta * Math.sin(this._angleRad + Math.PI);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this._x = newX;
        this._y = newY;
        this.updatePos();
    },
    set x(x) {
        this._x = x;
        this.updatePos();
    },
    set y(y) {
        this._y = y;
        this.updatePos();
    },
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    get absX() {
        return this.volume.x;
    },
    get absY() {
        return this.volume.y;
    },
    set z(z) {
        if (this._z === z) {
            return;
        }
        this._z = z;
        this.updateZ();
    },
    get z() {
        return this._z;
    },
    updateZ: function() {
        this.totalZ = this._z + this._parentZ;
        if (this._view) {
            this.totalZ += this._view._z;
        }
        if (this.children) {
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                child._parentZ = this.totalZ + 1e-5;
                child.updateZ();
            }
        }
        this.renderer.needSortDepth = true;
    },
    offset: function(x, y) {
        if (this._offsetX === x && this._offsetY === y) {
            return;
        }
        this._offsetX = x;
        this._offsetY = y;
        if (this._texture) {
            this.offsetPosX = Math.round(this._offsetX + this._texture.offsetX);
            this.offsetPosY = Math.round(this._offsetY + this._texture.offsetY);
        } else {
            this.offsetPosX = Math.round(this._offsetX);
            this.offsetPosY = Math.round(this._offsetY);
        }
        this.updateTotalOffset();
    },
    set offsetX(x) {
        if (this._offsetX === x) {
            return;
        }
        this._offsetX = x;
        if (this._texture) {
            this.offsetPosX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
        } else {
            this.offsetPosX = Math.round(this._offsetX * this.volume.scaleX);
        }
        this.updatePos();
    },
    set offsetY(y) {
        if (this._offsetY === y) {
            return;
        }
        this._offsetY = y;
        if (this._texture) {
            this.offsetPosY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);
        } else {
            this.offsetPosY = Math.round(this._offsetY * this.volume.scaleX);
        }
        this.updatePos();
    },
    get offsetX() {
        return this._offsetX;
    },
    get offsetY() {
        return this._offsetY;
    },
    pivot: function(x, y) {
        this.volume.pivot(x, y);
        this.renderer.needRender = true;
    },
    set pivotX(x) {
        this.volume.pivot(x, this.volume.pivotY);
        this.renderer.needRender = true;
    },
    set pivotY(y) {
        this.volume.pivot(this.volume.pivotX, y);
        this.renderer.needRender = true;
    },
    get pivotX() {
        return this.volume.pivotX;
    },
    get pivotY() {
        return this.volume.pivotY;
    },
    anchor: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this._anchorX = x;
        this._anchorY = y;
        this._updateAnchor();
    },
    _updateAnchor: function() {
        if (this._static) {
            var engine = meta.engine;
            this.anchorPosX = this.parent.volume.width * engine.zoom * this._anchorX;
            this.anchorPosY = this.parent.volume.height * engine.zoom * this._anchorY;
        } else {
            this.anchorPosX = this.parent.volume.width * this._anchorX;
            this.anchorPosY = this.parent.volume.height * this._anchorY;
        }
        this.updateTotalOffset();
    },
    set anchorX(x) {
        this._anchorX = x;
        this._updateAnchor();
    },
    set anchorY(y) {
        this._anchorY = y;
        this._updateAnchor();
    },
    get anchorX() {
        return this._anchorX;
    },
    get anchroY() {
        return this._anchorY;
    },
    set angle(value) {
        value = value * Math.PI / 180;
        if (this.volume.angle === value) {
            return;
        }
        this._angle = value;
        this.updateAngle();
    },
    set angleRad(value) {
        if (this._angle === value) {
            return;
        }
        this._angle = value;
        this.updateAngle(value);
    },
    get angle() {
        return this._angle * 180 / Math.PI;
    },
    get angleRad() {
        return this._angle;
    },
    updateAngle: function() {
        if (this.flags & this.Flag.IGNORE_PARENT_ANGLE) {
            this.volume.rotate(this._angle);
        } else {
            this.volume.rotate(this._angle + this.parent.volume.angle);
        }
        if (this.node) {
            this.renderer.culling.update(this);
        }
        if (this.children) {
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                if (child.flags & this.Flag.IGNORE_PARENT_ANGLE) {
                    continue;
                }
                child.updateAngle();
            }
        }
        this.renderer.needRender = true;
    },
    scale: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this._scaleX = x;
        this._scaleY = y;
        this._updateScale();
    },
    _updateScale: function() {
        this.volume.scale(this._scaleX * this._parentScaleX, this._scaleY * this._parentScaleY);
        if (this._texture) {
            this.totalOffsetX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
            this.totalOffsetY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);
        } else {
            this.totalOffsetX = Math.round(this._offsetX * this.volume.scaleX);
            this.totalOffsetY = Math.round(this._offsetY * this.volume.scaleY);
        }
        this._updateAnchor();
        if (this.children) {
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                if (child.flags & this.Flag.IGNORE_PARENT_SCALE) {
                    continue;
                }
                child._parentScaleX = this.volume.scaleX;
                child._parentScaleY = this.volume.scaleY;
                child._updateScale();
                child._updateAnchor();
            }
        }
        this.renderer.needRender = true;
    },
    fitIn: function(width, height) {
        if (this.volume.width < 1) {
            if (this.volume.height < 1) {
                this.volume.resize(1, 1);
            } else {
                this.volume.resize(1, this.volume.initHeight);
            }
        } else if (this.volume.height < 1) {
            this.volume.resize(this.volume.initWidth, 1);
        }
        this.flags |= this.Flag.FIT_IN;
        this.scale(width / this.volume.initWidth, height / this.volume.initHeight);
    },
    set scaleX(x) {
        if (this._scaleX === x) {
            return;
        }
        this._scaleX = x;
        this._updateScale();
    },
    set scaleY(y) {
        if (this._scaleY === y) {
            return;
        }
        this._scaleY = y;
        this._updateScale();
    },
    get scaleX() {
        return this._scaleX;
    },
    get scaleY() {
        return this._scaleY;
    },
    flip: function(x, y) {
        this.volume.flip(x, y);
        this.renderer.needRender = true;
    },
    set flipX(x) {
        this.flip(x, this.volume.flipY);
    },
    set flipY(y) {
        this.flip(this.volume.flipX, y);
    },
    get flipX() {
        return this.volume.flipX;
    },
    get flipY() {
        return this.volume.flipY;
    },
    set alpha(value) {
        if (this._alpha === value) {
            return;
        }
        this._alpha = value;
        this.updateAlpha();
    },
    get alpha() {
        return this._alpha;
    },
    updateAlpha: function() {
        this.totalAlpha = this._alpha * this.parent.totalAlpha;
        if (this.totalAlpha < 0) {
            this.totalAlpha = 0;
        } else if (this.totalAlpha > 1) {
            this.totalAlpha = 1;
        }
        if (this.children) {
            var child;
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                child = this.children[n];
                if (child.flags & this.Flag.IGNORE_PARENT_ALPHA) {
                    continue;
                }
                child.updateAlpha();
            }
        }
        this.volume.__transformed = 1;
        this.renderer.needRender = true;
    },
    resize: function(width, height) {
        if (this.volume.width === width && this.volume.height === height) {
            return;
        }
        this.volume.resize(width, height);
        this.updatePos();
        this._updateResize();
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                this.children[i]._updateResize();
            }
        }
        this.renderer.needRender = true;
    },
    set width(width) {
        if (this.texture) {
            if (this.volume.width !== width) {
                this.flags |= this.Flag.DYNAMIC_CLIP;
            } else {
                this.flags &= ~this.Flag.DYNAMIC_CLIP;
            }
        }
        this.resize(width, this.volume.height);
    },
    set height(height) {
        if (this.texture) {
            if (this.volume.height !== height) {
                this.flags |= this.Flag.DYNAMIC_CLIP;
            } else {
                this.flags &= ~this.Flag.DYNAMIC_CLIP;
            }
        }
        this.resize(this.volume.width, height);
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    },
    _updateResize: function() {
        this._updateAnchor();
        if (this.onResize) {
            this.onResize();
        }
    },
    onResize: null,
    clip: function(clip) {
        if (clip instanceof Entity.Geometry) {
            this.clipVolume = clip.volume;
        } else if (clip instanceof meta.math.AABB) {
            this.clipVolume = clip;
        } else {
            this.clipVolume = null;
        }
        this.renderer.needRender = true;
    },
    clipBounds: function(width, height) {
        if (!this.clipVolume) {
            this.clipVolume = new meta.math.AABB(0, 0, width, height);
        } else {
            this.clipVolume.set(0, 0, width, height);
        }
        this.flags |= this.Flag.CLIP_BOUNDS;
        this.renderer.needRender = true;
    },
    _onTextureEvent: function(data, event) {
        var resEvent = Resource.Event;
        if (event === resEvent.LOADED) {
            this.loaded = true;
        } else if (event === resEvent.UNLOADED) {
            this.loaded = false;
        }
        this.updateFromTexture();
    },
    _onLoadingEnd: function(data, event) {
        var texture = meta.resources.getTexture(this._textureName);
        if (!texture) {
            console.warn("(Entity.Geometry) Unavailable texture - " + this._textureName);
        } else {
            this.texture = texture;
        }
        meta.resources.onLoadingEnd.remove(this);
    },
    updateFromTexture: function() {
        if (this._texture) {
            if (this.flags & this.Flag.FIT_IN) {
                this.scale(this.volume.width / this._texture.width, this.volume.height / this._texture.height);
            }
            this.volume.resize(this._texture.width, this._texture.height);
            this.totalOffsetX = Math.round((this._offsetX + this._texture.offsetX) * this.volume.scaleX);
            this.totalOffsetY = Math.round((this._offsetY + this._texture.offsetY) * this.volume.scaleY);
        } else {
            if (this.flags & this.Flag.FIT_IN) {
                this.scale(this.volume.width, this.volume.height);
            } else {
                this.volume.resize(1, 1);
            }
            this.totalOffsetX = Math.round(this._offsetX * this.volume.scaleX);
            this.totalOffsetY = Math.round(this._offsetY * this.volume.scaleY);
        }
        this._updateAnchor();
        if (this.children) {
            var numChildren = this.children.length;
            for (var n = 0; n < numChildren; n++) {
                this.children[n]._updateAnchor();
            }
        }
    },
    onTextureChange: null,
    set texture(texture) {
        if (this._texture === texture) {
            return;
        }
        if (this._texture) {
            this._texture.unsubscribe(this);
        }
        if (texture) {
            if (typeof texture === "string") {
                this._texture = meta.resources.getTexture(texture);
                if (!this._texture) {
                    if (meta.resources.loading) {
                        this._textureName = texture;
                        meta.resources.onLoadingEnd.add(this._onLoadingEnd, this);
                    } else {
                        console.warn("(Entity.Geometry) Unavailable texture - " + texture);
                    }
                    return;
                }
            } else {
                this._texture = texture;
            }
            this._texture.subscribe(this._onTextureEvent, this);
            if (this._texture._loaded) {
                this.updateFromTexture();
                this.loaded = true;
            }
        } else {
            this._texture = texture;
            this.loaded = false;
        }
        this.anim.set(this._texture);
        if (this.onTextureChange) {
            this.onTextureChange();
        }
    },
    get texture() {
        return this._texture;
    },
    set updating(value) {
        if (value) {
            if (this.__updateIndex !== -1) {
                return;
            }
            this.flags |= this.Flag.UPDATING;
            if (this.flags & this.Flag.ACTIVE) {
                this.__updateIndex = this.renderer.entitiesUpdate.push(this) - 1;
            }
        } else {
            if (this.__updateIndex === -1) {
                return;
            }
            this.flags &= ~this.Flag.UPDATING;
            if (this.flags & this.Flag.ACTIVE) {
                this.renderer.entitiesUpdateRemove.push(this);
                this.__updateIndex = -1;
            }
        }
    },
    get updating() {
        return (this.flags & this.Flag.UPDATING) === this.Flag.UPDATING;
    },
    _setView: function(view) {
        this._view = view;
        if (view) {
            if (view.flags & view.Flag.ACTIVE && !(view.flags & view.Flag.INSTANCE_HIDDEN)) {
                this.renderer.addEntity(this);
            } else {
                this.renderer.removeEntity(this);
            }
        } else {
            this.renderer.removeEntity(this);
        }
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._setView(view);
            }
        }
    },
    attach: function(entity) {
        if (!entity) {
            console.warn("(Entity.Geometry.attach) Invalid entity passed");
            return;
        }
        if (entity === this) {
            console.warn("(Entity.Geometry.attach) Trying to attach themself");
            return;
        }
        if (entity._view) {
            console.warn("(Entity.Geometry.attach) Trying to attach entity that has already been attached to other entity");
            return;
        }
        entity.parent = this;
        if (!this.children) {
            this.children = [ entity ];
            this._updateScale();
        } else {
            this.children.push(entity);
            if ((entity.flags & this.Flag.IGNORE_PARENT_POS) === 0) {
                entity._parentX = this.volume.x - this.volume.pivotPosX - this.offsetPosX;
                entity._parentY = this.volume.y - this.volume.pivotPosY - this.offsetPosY;
                entity.updateTotalOffset();
            }
        }
        if (this._static) {
            entity._static = true;
        }
        if (this._debugger) {
            entity._debugger = true;
        }
        this.updateZ();
        if (this.volume.angle !== 0) {
            this.updateAngle();
        }
        if (this.totalAlpha !== 1) {
            this.updateAlpha();
        }
        this._updateHidden();
        if (this._view) {
            entity._setView(this._view);
        }
    },
    _detach: function(entity) {
        entity.parent = this.renderer.holder;
        entity.updateZ();
        entity._setView(null);
        if (this.volume.angle !== 0) {
            entity.updateAngle();
        }
        if (this.totalAlpha !== 1) {
            entity.updateAlpha();
        }
        entity._updateHidden();
    },
    detach: function(entity) {
        if (!entity) {
            console.warn("(Entity.Geometry.detach) Invalid entity has been passed");
            return;
        }
        if (entity.parent !== this) {
            console.warn("(Entity.Geometry.detach) Entity has different parent from this");
            return;
        }
        var index = this.children.indexOf(entity);
        this.children[index] = this.children[this.children.length - 1];
        this.children.pop();
        this._detach(entity);
    },
    detachAll: function() {
        if (!this.children) {
            return;
        }
        var num = this.children.length;
        for (var n = 0; n < num; n++) {
            this._detach(this.children[n]);
        }
        this.children.length = 0;
    },
    _updateHidden: function() {
        if (this.flags & this.Flag.INSTANCE_HIDDEN) {
            if (this.flags & this.Flag.HIDDEN) {
                return;
            }
            if (this.parent.flags & this.Flag.INSTANCE_HIDDEN) {
                if ((this.flags & this.Flag.IGNORE_PARENT_HIDDEN) === 0) {
                    return;
                }
            }
            this.flags &= ~this.Flag.INSTANCE_HIDDEN;
        } else {
            if (this.flags & this.Flag.HIDDEN || this.parent.flags & this.Flag.INSTANCE_HIDDEN && (this.flags & this.Flag.IGNORE_PARENT_HIDDEN) === 0) {
                this.flags |= this.Flag.INSTANCE_HIDDEN;
            } else {
                return;
            }
        }
        if (this.children) {
            var num = this.children.length;
            for (var n = 0; n < num; n++) {
                this.children[n]._updateHidden();
            }
        }
    },
    set hidden(value) {
        if (value) {
            if (this.flags & this.Flag.HIDDEN) {
                return;
            }
            this.flags |= this.Flag.HIDDEN;
        } else {
            if ((this.flags & this.Flag.HIDDEN) === 0) {
                return;
            }
            this.flags &= ~this.Flag.HIDDEN;
        }
        this._updateHidden();
    },
    get hidden() {
        return (this.flags & this.Flag.HIDDEN) === this.Flag.HIDDEN;
    },
    set state(name) {
        if (this._state === name) {
            return;
        }
        if (this.onStateExit) {
            this.onStateExit();
        }
        this._state = name;
        if (this.onStateEnter) {
            this.onStateEnter();
        }
    },
    get state() {
        return this._state;
    },
    onStateChange: null,
    set picking(value) {
        if (value) {
            if (this.__pickIndex !== -1) {
                return;
            }
            this.flags |= this.Flag.PICKING;
            if (this.flags & this.Flag.RENDER) {
                this.__pickIndex = this.renderer.entitiesPicking.push(this) - 1;
            }
        } else {
            if (this.__pickIndex === -1) {
                return;
            }
            this.flags &= ~this.Flag.PICKING;
            if (this.flags & this.Flag.RENDER) {
                this.renderer.entitiesPickingRemove.push(this);
                this.__pickIndex = -1;
            }
        }
    },
    get picking() {
        return (this.flags & this.Flag.PICKING) === this.Flag.PICKING;
    },
    isPointInside: function(x, y) {
        if (this.volume.__transformed == 1) {
            var offsetX = x - this.volume.x;
            var offsetY = y - this.volume.y;
            x = offsetX * this.volume.cos + offsetY * this.volume.sin + this.volume.x;
            y = offsetY * this.volume.cos - offsetX * this.volume.sin + this.volume.y;
        }
        return this.volume.vsPoint(x, y);
    },
    isPointInsidePx: function(x, y) {
        var volume = this.volume;
        if (volume.__transformed == 1) {
            var offsetX = x - volume.x;
            var offsetY = y - volume.y;
            x = offsetX * volume.cos + offsetY * volume.sin + volume.x;
            y = offsetY * volume.cos - offsetX * volume.sin + volume.y;
        }
        if (!this.volume.vsPoint(x, y)) {
            return false;
        }
        var offsetX = (x - volume.minX) / volume.scaleX | 0;
        var offsetY = (y - volume.minY) / volume.scaleY | 0;
        var pixel = this._texture.getPixelAt(offsetX, offsetY);
        if (pixel[3] > 50) {
            return true;
        }
        return false;
    },
    onDown: null,
    onUp: null,
    onClick: null,
    onDbClick: null,
    onDrag: null,
    onDragStart: null,
    onDragEnd: null,
    onHover: null,
    onHoverEnter: null,
    onHoverExit: null,
    dragStart: function(x, y) {
        this._dragOffsetX = x - this.volume.x;
        this._dragOffsetY = y - this.volume.y;
    },
    dragTo: function(x, y) {
        x -= this.totalOffsetX + this._dragOffsetX;
        y -= this.totalOffsetY + this._dragOffsetY;
        if (this.volume.x === x && this.volume.y === y) {
            return;
        }
        this.position(x, y);
    },
    addTimer: function(func, tDelta, numTimes) {
        var timer = meta.addTimer(this, func, tDelta, numTimes);
        if (!this.timers) {
            this.timers = [ timer ];
        } else {
            this.timers.push(timer);
        }
        return timer;
    },
    set tween(obj) {
        if (!obj) {
            this._tween = null;
            return;
        }
        if (!this._tweenCache) {
            this._tweenCache = new meta.Tween.Cache(this);
        } else {
            this._tweenCache.stop();
            this._tweenCache = new meta.Tween.Cache(this);
        }
        if (obj instanceof meta.Tween.Link) {
            this._tweenCache.tween = obj.tween;
        } else if (obj instanceof meta.Tween) {
            this._tweenCache.tween = obj;
        } else {
            console.warn("(Entity.Geometry.set::tween) Ivalid object! Should be meta.Tween or meta.Tween.Link object");
            return;
        }
        var tween = this._tweenCache.tween;
        if (tween.autoPlay) {
            tween.cache = this._tweenCache;
            tween.play();
        }
    },
    get tween() {
        if (!this._tweenCache) {
            this.tween = new meta.Tween();
        }
        this._tweenCache.tween.cache = this._tweenCache;
        return this._tweenCache.tween;
    },
    addComponent: function(component, params) {
        if (typeof component === "string") {
            component = Component[component];
        }
        if (!component) {
            console.warn("(Entity.Geometry.addComponent) Adding an invalid component");
            return null;
        }
        var name = component.prototype.__lastName__;
        if (this.components && this.components[name]) {
            console.warn("(Entity.Geometry.addComponent) Entity already has component: " + name);
            return null;
        }
        var comp = new component(this);
        comp.owner = this;
        if (params) {
            for (var key in params) {
                comp[key] = params[key];
            }
        }
        if (this.parent.components === this.components) {
            this.components = {};
        }
        this.components[name] = comp;
        if (comp.onAdd) {
            comp.onAdd();
        }
        return comp;
    },
    removeComponent: function(name) {
        var comp = this.components[name];
        if (!comp || typeof comp !== "object") {
            console.warn("(Entity.Geometry.removeComponent) No such component added: " + name);
            return;
        }
        var found = false;
        var numComponents = this.components.length;
        for (var i = 0; i < numComponents; i++) {
            if (this.components[i] === comp) {
                this.components[i] = this.components[numComponents - 1];
                this.components.pop();
                found = true;
                break;
            }
        }
        if (!found) {
            console.warn("(Entity.Geometry.removeComponent) No such components added in: " + name);
            return;
        }
        if (comp.unload) {
            comp.unload();
        }
        this[name] = null;
    },
    removeAllComponents: function() {
        if (!components) {
            return;
        }
        var numComponents = this.components.length;
        for (var i = 0; i < numComponents; i++) {
            this.removeComponent(this.components[i]);
        }
    },
    lookAt: function(x, y) {
        if (this.flags & this.Flag.IGNORE_PARENT_ANGLE) {
            this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI;
        } else {
            this.angleRad = -Math.atan2(x - this.volume.x, y - this.volume.y) + Math.PI - this.parent.volume.angle;
        }
    },
    set loaded(value) {
        if (value) {
            if (this.flags & this.Flag.LOADED) {
                return;
            }
            this.flags |= this.Flag.LOADED;
        } else {
            if ((this.flags & this.Flag.LOADED) === 0) {
                return;
            }
            this.flags &= ~this.Flag.LOADED;
        }
    },
    get loaded() {
        return (this.flags & this.Flag.LOADED) === this.Flag.LOADED;
    },
    set static(value) {
        if (value) {
            if (this.flags & this.Flag.STATIC) {
                return;
            }
            this.flags |= this.Flag.STATIC;
        } else {
            if ((this.flags & this.Flag.STATIC) === 0) {
                return;
            }
            this.flags &= ~this.Flag.STATIC;
        }
    },
    get static() {
        return (this.flags & this.Flag.STATIC) === this.Flag.STATIC;
    },
    set debug(value) {
        if (value) {
            if (this.flags & this.Flag.DEBUG) {
                return;
            }
            this.flags |= this.Flag.DEBUG;
            this.renderer.numDebug++;
        } else {
            if ((this.flags & this.Flag.DEBUG) === 0) {
                return;
            }
            this.flags &= ~this.Flag.DEBUG;
            this.renderer.numDebug--;
        }
        this.renderer.needRender = true;
    },
    get debug() {
        return (this.flags & this.Flag.DEBUG) === this.Flag.DEBUG;
    },
    Flag: {
        ENABLED: 1 << 0,
        INSTANCE_ENABLED: 1 << 1,
        HIDDEN: 1 << 2,
        INSTANCE_HIDDEN: 1 << 3,
        ACTIVE: 1 << 4,
        INSTANCE_ACTIVE: 1 << 5,
        VISIBILE: 1 << 6,
        UPDATING: 1 << 8,
        REMOVED: 1 << 9,
        IGNORE_PARENT_POS: 1 << 10,
        IGNORE_PARENT_Z: 1 << 11,
        IGNORE_PARENT_ANGLE: 1 << 12,
        IGNORE_PARENT_ALPHA: 1 << 13,
        IGNORE_PARENT_SCALE: 1 << 14,
        IGNORE_PARENT_HIDDEN: 1 << 15,
        RENDER: 1 << 16,
        RENDER_REMOVE: 1 << 17,
        DEBUG: 1 << 18,
        DYNAMIC_CLIP: 1 << 19,
        FIT_IN: 1 << 20,
        CLIP_BOUNDS: 1 << 21,
        LOADED: 1 << 22,
        STATIC: 1 << 24,
        PICKING: 1 << 25,
        ROOT: 1 << 26
    },
    renderer: null,
    parent: null,
    _view: null,
    node: null,
    _texture: null,
    _x: 0,
    _y: 0,
    _parentX: 0,
    _parentY: 0,
    _z: 0,
    totalZ: 0,
    _parentZ: 0,
    _angle: 0,
    _alpha: 1,
    totalAlpha: 1,
    _scaleX: 1,
    _scaleY: 1,
    _parentScaleX: 1,
    _parentScaleY: 1,
    _offsetX: 0,
    _offsetY: 0,
    offsetPosX: 0,
    offsetPosY: 0,
    _anchorX: 0,
    _anchorY: 0,
    anchorPosX: 0,
    anchorPosY: 0,
    totalOffsetX: 0,
    totalOffsetY: 0,
    _dragOffsetX: 0,
    _dragOffsetY: 0,
    volume: null,
    clipVolume: null,
    children: null,
    anim: null,
    _state: "",
    timers: null,
    _tweenCache: null,
    components: {},
    hover: false,
    pressed: false,
    dragged: false,
    __debug: false,
    __updateIndex: -1,
    __pickIndex: -1,
    flags: 0
});

"use strict";

meta.class("Entity.Text", "Entity.Geometry", {
    onCreate: function(params) {
        this.texture = new Resource.Texture();
        this._texture.resize(this._fontSize, this._fontSize);
        this._textBuffer = new Array(1);
        this.text = params;
    },
    initArg: function() {},
    updateTxt: function() {
        var n, i, fontHeight;
        var ctx = this._texture.ctx;
        var width = 0;
        var posX = 0;
        var posY = 0;
        var numLines = this._textBuffer.length;
        if (this._bitmapFont) {
            if (!this._bitmapFont.loaded) {
                return;
            }
            var canvas = this._bitmapFont.texture.canvas;
            var chars = this._bitmapFont.chars;
            var charRect = null;
            var numChars, tmpWidth, currText;
            fontHeight = this._bitmapFont.height;
            for (n = 0; n < numLines; n++) {
                currText = this._textBuffer[n];
                numChars = currText.length;
                tmpWidth = 0;
                for (i = 0; i < numChars; i++) {
                    charRect = chars[currText.charCodeAt(i)];
                    if (!charRect) {
                        continue;
                    }
                    tmpWidth += charRect.kerning;
                }
                if (tmpWidth > width) {
                    width = tmpWidth;
                }
            }
            this._texture.clear();
            this._texture.resize(width, fontHeight * numLines);
            for (n = 0; n < numLines; n++) {
                currText = this._textBuffer[n];
                numChars = currText.length;
                for (i = 0; i < numChars; i++) {
                    charRect = chars[currText.charCodeAt(i)];
                    if (!charRect) {
                        continue;
                    }
                    ctx.drawImage(canvas, charRect.x, charRect.y, charRect.width, charRect.height, posX, posY + charRect.offsetY, charRect.width, charRect.height);
                    posX += charRect.kerning;
                }
                posY += fontHeight;
                posX = 0;
            }
        } else {
            ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
            var metrics;
            for (n = 0; n < numLines; n++) {
                metrics = ctx.measureText(this._textBuffer[n]);
                if (metrics.width > width) {
                    width = metrics.width;
                }
            }
            if (this._shadow) {
                width += this._shadowBlur * 2;
                posX += this._shadowBlur;
            }
            fontHeight = this._fontSize * 1.3;
            this._texture.resize(width, fontHeight * numLines);
            ctx.clearRect(0, 0, this.volume.initWidth, this.volume.initHeight);
            ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
            ctx.fillStyle = this._color;
            ctx.textBaseline = "top";
            if (this._shadow) {
                ctx.shadowColor = this._shadowColor;
                ctx.shadowOffsetX = this._shadowOffsetX;
                ctx.shadowOffsetY = this._shadowOffsetY;
                ctx.shadowBlur = this._shadowBlur;
            }
            if (this._outline) {
                ctx.lineWidth = this._outlineWidth;
                ctx.strokeStyle = this._outlineColor;
            }
            for (n = 0; n < numLines; n++) {
                ctx.fillText(this._textBuffer[n], posX, posY);
                if (this._outline) {
                    ctx.strokeText(this._textBuffer[n], posY, posY);
                }
                posY += fontHeight;
            }
        }
        this.renderer.needRender = true;
    },
    set text(text) {
        if (text !== void 0) {
            if (typeof text === "number") {
                this._text = text + "";
                this._textBuffer[0] = this._text;
            } else {
                this._text = text;
                var newlineIndex = text.indexOf("\n");
                if (newlineIndex !== -1) {
                    this._textBuffer = text.split("\n");
                } else {
                    this._textBuffer[0] = this._text;
                }
            }
        } else {
            this._text = "";
            this._textBuffer[0] = this._text;
        }
        this.updateTxt();
    },
    get text() {
        return this._text;
    },
    set font(font) {
        var fontResource = meta.resources.getResource(font, Resource.Type.FONT);
        if (!fontResource) {
            this._font = font;
            this._bitmapFont = null;
        } else {
            this._bitmapFont = fontResource;
            if (!fontResource._loaded) {
                this._texture.clear();
                fontResource.subscribe(this._onFontEvent, this);
                return;
            }
        }
        this.updateTxt();
    },
    get font() {
        return this._font;
    },
    set size(size) {
        this._fontSize = size;
        this._fontSizePx = size + "px";
        this.updateTxt();
    },
    get size() {
        return this._fontSize;
    },
    set color(color) {
        this._color = color;
        this.updateTxt();
    },
    get color() {
        return this._color;
    },
    set style(style) {
        if (this._style === style) {
            return;
        }
        this._style = style;
        this.updateTxt();
    },
    get style() {
        return this._style;
    },
    set outlineColor(color) {
        if (this._outlineColor === color) {
            return;
        }
        this._outlineColor = color;
        this._outline = true;
        this.updateTxt();
    },
    get outlineColor() {
        return this._outlineColor;
    },
    set outlineWidth(width) {
        if (this._outlineWidth === width) {
            return;
        }
        this._outlineWidth = width;
        this._outline = true;
        this.updateTxt();
    },
    get outlineWidth() {
        return this._outlineWidth;
    },
    set outline(value) {
        if (this._outline === value) {
            return;
        }
        this._outline = value;
        this.updateTxt();
    },
    get outline() {
        return this._outline;
    },
    set shadow(value) {
        if (this._shadow === value) {
            return;
        }
        this._shadow = value;
        this.updateTxt();
    },
    get shadow() {
        return this._shadow;
    },
    set shadowColor(value) {
        if (this._shadowColor === value) {
            return;
        }
        this._shadowColor = value;
        this._shadow = true;
        this.updateTxt();
    },
    get shadowColor() {
        return this._shadowColor;
    },
    set shadowBlur(value) {
        if (this._shadowBlur === value) {
            return;
        }
        this._shadowBlur = value;
        this._shadow = true;
        this.updateTxt();
    },
    get shadowBlur() {
        return this._shadowBlur;
    },
    set shadowOffsetX(value) {
        if (this._shadowOffsetX === value) {
            return;
        }
        this._shadowOffsetX = value;
        this._shadow = true;
        this.updateTxt();
    },
    set shadowOffsetY(value) {
        if (this._shadowOffsetY === value) {
            return;
        }
        this._shadowOffsetY = value;
        this._shadow = true;
        this.updateTxt();
    },
    get shadowOffsetX() {
        return this._shadowOffsetY;
    },
    get shadowOffsetY() {
        return this._shadowOffsetY;
    },
    _onFontEvent: function(data, event) {
        this.updateTxt();
    },
    _bitmapFont: null,
    _text: "",
    _textBuffer: null,
    _font: "Tahoma",
    _fontSize: 12,
    _fontSizePx: "12px",
    _color: "#fff",
    _style: "",
    _outline: false,
    _outlineColor: "#000",
    _outlineWidth: 1,
    _shadow: true,
    _shadowColor: "#000",
    _shadowBlur: 3,
    _shadowOffsetX: 0,
    _shadowOffsetY: 0
});

"use strict";

meta.class("Entity.Tiling", "Entity.Geometry", {
    onCreate: function(texture) {
        var volume = meta.camera.volume;
        var newTexture = new Resource.Texture();
        newTexture.ctx.globalCompositeOperator = "copy";
        this.texture = newTexture;
        this.tile(texture);
    },
    draw: function(ctx) {
        var x = this.volume.minX | 0;
        var y = this.volume.minY | 0;
        ctx.transform(this.volume.m11, this.volume.m12, this.volume.m21, this.volume.m22, this.volume.x | 0, this.volume.y | 0);
        ctx.beginPath();
        ctx.rect(-this.volume.initPivotPosX, -this.volume.initPivotPosY, this.volume.width, this.volume.height);
        ctx.clip();
        var image = this.tileTexture.canvas;
        var width = this.tileTexture.fullWidth;
        var height = this.tileTexture.fullHeight;
        var posX = this._tileOffsetX;
        var posY = this._tileOffsetY;
        for (var y = 0; y < this._drawTilesY; y++) {
            for (var x = 0; x < this._drawTilesX; x++) {
                ctx.drawImage(image, posX, posY);
                posX += width;
            }
            posX = this._tileOffsetX;
            posY += height;
        }
    },
    tile: function(texture) {
        if (this.tileTexture && !this.tileTexture._loaded) {
            this.tileTexture.unsubscribe(this);
        }
        if (typeof texture === "string") {
            this.tileTexture = meta.resources.getTexture(texture);
            if (!this.tileTexture) {
                console.warn("(Entity.Tiling.tile) Could not find texture with a name - " + texture);
                return;
            }
        } else {
            this.tileTexture = texture;
        }
        if (!this.tileTexture._loaded) {
            this.tileTexture.subscribe(this.onTextureEvent, this);
            return;
        }
        this.updateTiling();
    },
    options: function(opts) {
        this.tileX = opts.tileX || 0;
        this.tileY = opts.tileY || 0;
        if (opts.wrap !== void 0) {
            this.wrap = opts.wrap;
        }
        var follow = opts.follow || false;
        if (follow !== this.follow) {
            meta.subscribe(meta.Event.CAMERA_MOVE, this.onResize, this);
        } else {
            meta.unsubscribe(meta.Event.CAMERA_MOVE, this);
        }
        this.follow = follow;
        this.updateSize();
    },
    resize: function(width, height) {
        this._origWidth = width;
        this._origHeight = height;
        this._super(width, height);
        this.updateSize();
    },
    updateTiling: function() {
        if (!this.tileTexture._loaded) {
            return;
        }
        var width = this.tileTexture.fullWidth;
        var height = this.tileTexture.fullHeight;
        var scrollX = this._scrollX;
        var scrollY = this._scrollY;
        if (this.follow) {
            var cameraVolume = meta.camera.volume;
            scrollX -= cameraVolume.minX;
            scrollY -= cameraVolume.minY;
        }
        if (this.tileX === 0) {
            if (scrollX > 0) {
                this._tileOffsetX = scrollX % width - width;
            } else {
                this._tileOffsetX = scrollX % width;
            }
        } else {
            this._tileOffsetX = scrollX;
        }
        if (this.tileY === 0) {
            if (scrollY > 0) {
                this._tileOffsetY = scrollY % height - height;
            } else {
                this._tileOffsetY = scrollY % height;
            }
        } else {
            this._tileOffsetY = scrollY;
        }
        this._drawTilesX = Math.ceil((this._texture.fullWidth - this._tileOffsetX) / width);
        this._drawTilesY = Math.ceil((this._texture.fullHeight - this._tileOffsetY) / height);
        this._tileOffsetX -= this.volume.initPivotPosX;
        this._tileOffsetY -= this.volume.initPivotPosY;
        if (this.tileX > 0 && this._drawTilesX > this.tileX) {
            this._drawTilesX = this.tileX;
        }
        if (this.tileY > 0 && this._drawTilesY > this.tileY) {
            this._drawTilesY = this.tileY;
        }
        this.renderer.needRender = true;
    },
    updateSize: function() {
        if (!this.tileTexture || !this.tileTexture._loaded) {
            return;
        }
        var width = 1;
        var height = 1;
        if (this._origWidth > 0) {
            width = this._origWidth;
        } else {
            if (this.tileX === 0) {
                width = this.parent.width;
            } else {
                width = this.tileTexture.fullWidth * this.tileX;
            }
        }
        if (this._origHeight > 0) {
            height = this._origHeight;
        } else {
            if (this.tileY === 0) {
                height = this.parent.height;
            } else {
                height = this.tileTexture.fullHeight * this.tileY;
            }
        }
        this._texture.resizeSilently(width, height);
        this.volume.resize(width, height);
        this.updateTiling();
    },
    onTextureEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            this.tileTexture.unsubscribe(this);
            this.updateSize();
        }
    },
    onResize: function(data, event) {
        this.updateSize();
    },
    scroll: function(x, y) {
        this._scrollX = x;
        this._scrollY = y;
        this.updateTiling();
    },
    tileTexture: null,
    follow: false,
    tileX: 0,
    tileY: 0,
    _scrollX: 0,
    _scrollY: 0,
    _tileScaleX: 1,
    _tileScaleY: 1,
    _drawTilesX: 0,
    _drawTilesY: 0,
    _tileOffsetX: 0,
    _tileOffsetY: 0,
    _origWidth: 0,
    _origHeight: 0
});

"use strict";

meta.class("Entity.TilemapLayer", "Entity.Geometry", {
    draw: function(ctx) {
        if (!this.parent.loaded) {
            return;
        }
        var cameraVolume = meta.camera.volume;
        var startTileX = Math.floor((cameraVolume.minX - this.volume.minX) / this.tileWidth);
        var startTileY = Math.floor((cameraVolume.minY - this.volume.minY) / this.tileHeight);
        var endTileX = Math.ceil((cameraVolume.maxX - this.volume.minX) / this.tileWidth);
        var endTileY = Math.ceil((cameraVolume.maxY - this.volume.minY) / this.tileHeight);
        if (startTileX < 0) {
            startTileX = 0;
        }
        if (startTileY < 0) {
            startTileY = 0;
        }
        if (endTileX > this.tilesX) {
            endTileX = this.tilesX;
        }
        if (endTileY > this.tilesY) {
            endTileY = this.tilesY;
        }
        var minX = Math.floor(this.volume.minX + startTileX * this.tileWidth);
        var minY = Math.floor(this.volume.minY + startTileY * this.tileHeight);
        var id = 0, info;
        var posX = minX | 0;
        var posY = minY | 0;
        if (this._dataFlags) {
            var flags = 0;
            for (var y = startTileY; y < endTileY; y++) {
                id = startTileX + y * this.tilesX;
                for (var x = startTileX; x < endTileX; x++) {
                    info = this._dataInfo[id];
                    if (info) {
                        flags = this._dataFlags[id];
                        if (flags) {
                            var flipX = 1;
                            var flipY = 1;
                            var offsetX = 0;
                            var offsetY = 0;
                            ctx.save();
                            if (flags & 536870912) {
                                ctx.rotate(Math.PI / 2);
                                if (flags & 2147483648 && flags & 1073741824) {
                                    flipX = -1;
                                    offsetX = this.tileWidth;
                                    offsetY = this.tileHeight;
                                } else if (flags & 2147483648) {
                                    offsetY = this.tileWidth;
                                } else if (flags & 1073741824) {
                                    flipX = -1;
                                    flipY = -1;
                                    offsetX = this.tileWidth;
                                } else {
                                    flipY = -1;
                                }
                            } else {
                                if (flags & 2147483648) {
                                    flipX = -1;
                                    offsetX = this.tileWidth;
                                }
                                if (flags & 1073741824) {
                                    flipY = -1;
                                    offsetY = this.tileHeight;
                                }
                            }
                            ctx.scale(flipX, flipY);
                            ctx.drawImage(info.canvas, info.posX, info.posY, this.tileWidth, this.tileHeight, posX * flipX - offsetX, posY * flipY - offsetY, this.tileWidth, this.tileHeight);
                            ctx.restore();
                        } else {
                            ctx.drawImage(info.canvas, info.posX, info.posY, this.tileWidth, this.tileHeight, posX, posY, this.tileWidth, this.tileHeight);
                        }
                    }
                    id++;
                    posX += this.tileWidth;
                }
                posX = minX | 0;
                posY += this.tileHeight;
            }
        } else {
            for (var y = startTileY; y < endTileY; y++) {
                id = startTileX + y * this.tilesX;
                for (var x = startTileX; x < endTileX; x++) {
                    info = this._dataInfo[id++];
                    if (info) {
                        ctx.drawImage(info.canvas, info.posX, info.posY, this.tileWidth, this.tileHeight, Math.floor(posX), Math.floor(posY), this.tileWidth, this.tileHeight);
                    }
                    posX += this.tileWidth;
                }
                posX = minX;
                posY += this.tileHeight;
            }
        }
    },
    updateFromData: function() {
        this.totalTiles = this.tilesX * this.tilesY;
        this.resize(this.tilesX * this.tileWidth, this.tilesY * this.tileHeight);
        var num = this._data.length;
        if (!this._dataInfo) {
            this._dataInfo = new Array(num);
        } else if (this._dataInfo.length !== num) {
            this._dataInfo.length = num;
        }
        this._tilesets = this.parent.tilesets;
        this._numTilesets = this._tilesets.length;
        for (var n = 0; n < num; n++) {
            this._updateDataInfoCell(n);
        }
        this.renderer.needRender = true;
    },
    _updateDataInfoCell: function(id) {
        var gid = this._data[id];
        if (!gid) {
            this._dataInfo[id] = null;
        } else {
            if (gid & 536870912 || gid & 1073741824 || gid & 2147483648) {
                if (!this._dataFlags) {
                    this._dataFlags = new Uint32Array(this._data.length);
                }
                var flag = 0;
                flag |= gid & 536870912;
                flag |= gid & 1073741824;
                flag |= gid & 2147483648;
                this._dataFlags[id] = flag;
                gid &= 536870911;
            }
            var tileset = this._tilesets[0];
            for (var i = 1; i < this._numTilesets; i++) {
                if (gid < this._tilesets[i].gid) {
                    break;
                }
                tileset = this._tilesets[i];
            }
            this._dataInfo[id] = tileset.getCell(gid);
        }
    },
    setGid: function(x, y, gid) {
        var id = x + y * this.tilesX;
        this._data[id] = gid;
        if (this.parent.loaded) {
            this._updateDataInfoCell(id);
            this.renderer.needRender = true;
        }
    },
    getGid: function(x, y) {
        var id = x + y * this.tilesX;
        if (id < 0) {
            return 0;
        }
        if (id >= this.totalTiles) {
            return 0;
        }
        return this.data[id];
    },
    gridFromWorldPos: function(worldX, worldY) {
        var gridX = Math.floor((worldX - this.volume.minX) / this.tileWidth);
        var gridY = Math.floor((worldY - this.volume.minY) / this.tileHeight);
        var id = gridX + gridY * this.tilesX;
        if (id < 0) {
            return null;
        }
        if (id >= this.totalTiles) {
            return null;
        }
        return [ gridX, gridY ];
    },
    saveData: function() {
        if (!this.data) {
            console.warn("(Entity.Tilemap.saveData): No data available for saving");
            return;
        }
        if (!this.savedData) {
            this.savedData = new Uint32Array(this.totalTiles);
        } else if (this.savedData.length !== this.totalTiles) {
            this.savedData.length = this.totalTiles;
        }
        for (var n = 0; n < this.totalTiles; n++) {
            this.savedData[n] = this.data[n];
        }
    },
    restoreData: function() {
        if (!this.savedData) {
            console.warn("(Entity.Tilemap.restoreData): No saved data available");
            return;
        }
        if (this.savedData.length !== this.totalTiles) {
            console.warn("(Entity.Tilemap.restoreData): Incompatible data saved");
            this.savedData = null;
            return;
        }
        for (var n = 0; n < this.totalTiles; n++) {
            this.data[n] = this.savedData[n];
        }
        this.updateFromData();
    },
    set data(data) {
        this._data = data;
        if (this.parent.loaded) {
            this.updateFromData();
        }
    },
    get data() {
        return this._data;
    },
    name: "Undefined",
    tilesX: 0,
    tilesY: 0,
    totalTiles: 0,
    tileWidth: 0,
    tileHeight: 0,
    _data: null,
    _dataInfo: null,
    _dataFlags: null,
    _tilesets: null,
    _numTilesets: 0
});

meta.class("Entity.Tilemap", "Entity.Geometry", {
    initArg: function(path) {
        if (!path) {
            return;
        }
        this.load(path);
    },
    load: function(path) {
        if (!path) {
            console.warn("(Entity.Tilemap.load): Invalid path specified");
            return;
        }
        var index = path.lastIndexOf(".") + 1;
        var pathIndex = path.lastIndexOf("/");
        var ext = path.substr(index);
        this.path = path;
        this.folderPath = path.substr(0, pathIndex + 1);
        this.loaded = false;
        this.tilesets = [];
        var self = this;
        var parseFunc = this["_parse_" + ext];
        if (!parseFunc) {
            console.warn("(Entity.Tilemap.load): Unsupported file format: " + ext);
            return;
        }
        meta.resources.loadFile(path, function(data) {
            parseFunc.call(self, data);
        });
    },
    create: function(tilesX, tilesY, tileWidth, tileHeight) {
        this.tilesX = tilesX;
        this.tilesY = tilesY;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.resize(tilesX * tileWidth, tilesY * tileHeight);
        this.tilesets = [];
        this.detachAll();
    },
    createTileset: function(gid, texture, tileWidth, tileHeight) {
        if (gid < 1) {
            console.warn("(Entity.Tilemap.createTileset): gid argument should be 1 or larger number");
            return;
        }
        var tileset = new meta.Tileset(this, gid, texture, tileWidth || 0, tileHeight || 0);
        this.tilesets.push(tileset);
    },
    createLayer: function(tilesX, tilesY, data, name) {
        var layer = new Entity.TilemapLayer();
        layer.tilesX = tilesX;
        layer.tilesY = tilesY;
        layer.tileWidth = this.tileWidth;
        layer.tileHeight = this.tileHeight;
        layer.resize(tilesX * this.tileWidth, tilesY * this.tileHeight);
        this.attach(layer);
        layer.data = data;
        if (name) {
            layer.name = name;
        }
        return layer;
    },
    finishLoading: function() {
        var num = this.children.length;
        for (var n = 0; n < num; n++) {
            this.children[n].updateFromData();
        }
        this.loaded = true;
    },
    _parse_json: function(data) {
        var json = JSON.parse(data);
        this.create(json.width, json.height, json.tilewidth, json.tileheight);
        var tileset;
        var tilesets = json.tilesets;
        var num = tilesets.length;
        for (var n = 0; n < num; n++) {
            tileset = tilesets[n];
            this.createTileset(tileset.firstgid, this.folderPath + tileset.image, tileset.tileWidth, tileset.tileHeight);
        }
        var layer, layerInfo;
        var layers = json.layers;
        num = layers.length;
        for (n = 0; n < num; n++) {
            layerInfo = layers[n];
            layer = this.createLayer(layerInfo.width, layerInfo.height, layerInfo.data, layerInfo.name);
            if (layerInfo.visible) {
                layer.visible = layerInfo.visible;
            }
        }
        if (this.numToLoad === 0) {
            this.loaded = true;
        }
    },
    _parse_tmx: function(data) {
        var parser = new DOMParser();
        var xml = parser.parseFromString(data, "text/xml");
        var node = xml.documentElement;
        this.create(parseInt(node.getAttribute("width")), parseInt(node.getAttribute("height")), parseInt(node.getAttribute("tilewidth")), parseInt(node.getAttribute("tilewidth")));
        var childNodes = node.childNodes;
        var numNodes = childNodes.length;
        for (var i = 0; i < numNodes; i++) {
            node = childNodes[i];
            if (node.nodeType !== 1) {
                continue;
            }
            if (node.nodeName === "tileset") {
                this.createTileset(parseInt(node.getAttribute("firstgid")), this.folderPath + node.childNodes[1].getAttribute("source"), parseInt(node.getAttribute("tilewidth")), parseInt(node.getAttribute("tileheight")));
            } else if (node.nodeName === "layer") {
                this._parse_tmx_layer(node);
            } else if (node.nodeName === "objectgroup") {}
        }
        if (this.numToLoad === 0) {
            this.loaded = true;
        }
    },
    _parse_tmx_layer: function(node) {
        var name = node.getAttribute("name");
        var tilesX = parseInt(node.getAttribute("width"));
        var tilesY = parseInt(node.getAttribute("height"));
        var visible = true;
        var visibleStr = node.getAttribute("visible");
        if (visibleStr) {
            visible = parseInt(visible);
        }
        var dataNode = node.firstElementChild;
        var encoding = dataNode.getAttribute("encoding");
        var n;
        var num = tilesX * tilesY;
        var data = new Uint32Array(num);
        if (encoding) {
            var strData = null;
            if (encoding === "csv") {
                strData = dataNode.textContent.split(",");
                if (strData.length !== num) {
                    console.warn("(Entity.Tilemap._parse_tmx): Layer resolution does not match with data size");
                    return;
                }
            } else {
                console.warn("(Entity.Tilemap._parse_tmx): Unsupported layer encoding used: " + encoding);
                return;
            }
            for (n = 0; n < num; n++) {
                data[n] = parseInt(strData[n]);
            }
        } else {
            var id = 0;
            var dataNodes = dataNode.childNodes;
            num = dataNodes.length;
            for (n = 0; n < num; n++) {
                node = dataNodes[n];
                if (node.nodeType !== 1) {
                    continue;
                }
                data[id++] = parseInt(node.getAttribute("gid"));
            }
        }
        var layer = this.createLayer(tilesX, tilesY, data, name);
        layer.visible = visible;
    },
    getLayer: function(name) {
        if (!name) {
            return null;
        }
        if (!this.children) {
            return null;
        }
        var num = this.children.length;
        for (var n = 0; n < num; n++) {
            if (this.children[n].name === name) {
                return this.children[n];
            }
        }
        return null;
    },
    LayerFlag: {
        FLIP_HORIZONTALLY: 2147483648,
        FLIP_VERTICALLY: 1073741824,
        FLIP_DIAGONALLY: 536870912
    },
    tilesets: null,
    path: "",
    folderPath: "",
    numToLoad: 0,
    tilesX: 0,
    tilesY: 0,
    tileWidth: 0,
    tileHeight: 0
});

meta.Tileset = function(parent, gid, texture, tileWidth, tileHeight) {
    this.parent = parent;
    this.gid = gid;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.tilesX = 0;
    this.tilesY = 0;
    this._texture = null;
    this.cells = null;
    this.texture = texture;
};

meta.Tileset.prototype = {
    _onTextureEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            data.unsubscribe(this);
            this.updateTexture();
            this.parent.numToLoad--;
            if (this.parent.numToLoad === 0) {
                this.parent.finishLoading();
            }
        }
    },
    updateTexture: function() {
        if (this.tileWidth === 0) {
            this.tileWidth = this._texture.fullWidth;
            this.tilesX = 1;
        } else {
            this.tilesX = this._texture.fullWidth / this.tileWidth | 0;
        }
        if (this.tileHeight === 0) {
            this.tileHeight = this._texture.fullHeight;
            this.tilesY = 1;
        } else {
            this.tilesY = this._texture.fullHeight / this.tileHeight | 0;
        }
        this.cells = new Uint32Array(this.tilesX * this.tilesY);
    },
    getCell: function(gid) {
        gid -= this.gid;
        var cell = this.cells[gid];
        if (cell) {
            return cell;
        }
        var posX = gid % this.tilesX * this.tileWidth;
        var posY = (gid / this.tilesX | 0) * this.tileHeight;
        cell = new this.Cell(this._texture.canvas, posX, posY);
        this.cells[gid] = cell;
        return cell;
    },
    set texture(src) {
        if (src instanceof Resource.Texture) {
            this._texture = src;
        } else {
            var wildcardIndex = src.lastIndexOf(".");
            var slashIndex = src.lastIndexOf("/");
            if (slashIndex === -1) {
                slashIndex = 0;
            }
            var imgName = src.substr(slashIndex + 1, wildcardIndex - slashIndex - 1);
            var texture = meta.resources.getTexture(imgName);
            if (!texture) {
                texture = new Resource.Texture(src);
            }
            this._texture = texture;
        }
        if (!this._texture.loaded) {
            this.parent.numToLoad++;
            this._texture.subscribe(this._onTextureEvent, this);
        } else {
            this.updateTexture();
        }
    },
    get texture() {
        return this._texture;
    },
    Cell: function(canvas, posX, posY) {
        this.canvas = canvas;
        this.posX = posX;
        this.posY = posY;
    }
};

"use strict";

meta.class("Entity.ParticleEmitter", "Entity.Geometry", {
    onCreate: function() {
        this.particles = [];
        this.preset = "meteor";
    },
    update: function(tDelta) {
        this.elapsed += tDelta;
        if (this.elapsed > this.duration) {
            this.updating = false;
            return;
        }
        if (this.emissionRate > 0) {
            var rate = 1 / this.emissionRate;
            this.emissionCounter += tDelta;
            var num = Math.floor(this.emissionCounter / rate);
            if (num > 0) {
                this.emissionCounter -= num * rate;
                if (num > this.particles.length - this.numActive) {
                    num = this.particles.length - this.numActive;
                }
                var newNumActive = this.numActive + num;
                for (var i = this.numActive; i < newNumActive; i++) {
                    this.initParticle(this.particles[i]);
                }
                this.numActive = newNumActive;
            }
        }
        var particle;
        for (var n = 0; n < this.numActive; n++) {
            particle = this.particles[n];
            particle.life -= tDelta;
            if (particle.life <= 0) {
                this.numActive--;
                this.particles[n] = this.particles[this.numActive];
                this.particles[this.numActive] = particle;
                continue;
            }
            this.updateParticle(particle, tDelta);
        }
        this.renderer.needRender = true;
    },
    initParticle: function(particle) {
        particle.x = meta.random.numberF(-1, 1) * this.xVar;
        particle.y = meta.random.numberF(-1, 1) * this.yVar;
        particle.life = this.life + meta.random.numberF(-1, 1) * this.lifeVar;
        var speed = this.speed + meta.random.numberF(-1, 1) * this.speedVar;
        var angle = this.startAngle + meta.random.numberF(-1, 1) * this.startAngleVar;
        particle.velX = Math.cos(Math.PI * angle / 180) * speed;
        particle.vecY = -Math.sin(Math.PI * angle / 180) * speed;
        particle.radialAccel = this.radialAccel + this.radialAccelVar * meta.random.numberF(-1, 1);
        particle.tangentialAccel = this.tangentialAccel + this.tangentialAccelVar * meta.random.numberF(-1, 1);
        if (this._textureTinting) {
            particle.color[0] = this.startColor[0] + this.startColorVar[0] * meta.random.numberF(-1, 1);
            particle.color[1] = this.startColor[1] + this.startColorVar[1] * meta.random.numberF(-1, 1);
            particle.color[2] = this.startColor[2] + this.startColorVar[2] * meta.random.numberF(-1, 1);
            particle.color[3] = this.startColor[3] + this.startColorVar[3] * meta.random.numberF(-1, 1);
            this._endColor[0] = this.endColor[0] + this.endColorVar[0] * meta.random.numberF(-1, 1);
            this._endColor[1] = this.endColor[1] + this.endColorVar[1] * meta.random.numberF(-1, 1);
            this._endColor[2] = this.endColor[2] + this.endColorVar[2] * meta.random.numberF(-1, 1);
            this._endColor[3] = this.endColor[3] + this.endColorVar[3] * meta.random.numberF(-1, 1);
            particle.colorDelta[0] = (this._endColor[0] - this.startColor[0]) / particle.life;
            particle.colorDelta[1] = (this._endColor[1] - this.startColor[1]) / particle.life;
            particle.colorDelta[2] = (this._endColor[2] - this.startColor[2]) / particle.life;
            particle.colorDelta[3] = (this._endColor[3] - this.startColor[3]) / particle.life;
        }
        particle.scale = this.startScale + this.startScaleVar * meta.random.numberF(-1, 1);
        var endScale = this.endScale + this.endScaleVar * meta.random.numberF(-1, 1);
        particle.scaleDelta = (endScale - particle.scale) / particle.life;
    },
    updateParticle: function(particle, tDelta) {
        particle.forcesX = this.gravityX * tDelta;
        particle.forcesY = this.gravityY * tDelta;
        particle.velX += particle.forcesX;
        particle.vecY += particle.forcesY;
        particle.x += particle.velX * tDelta;
        particle.y += particle.vecY * tDelta;
        if (particle.color) {
            particle.color[0] += particle.colorDelta[0] * tDelta;
            particle.color[1] += particle.colorDelta[1] * tDelta;
            particle.color[2] += particle.colorDelta[2] * tDelta;
            particle.color[3] += particle.colorDelta[3] * tDelta;
        }
        particle.scale += this.scaleDelta;
    },
    draw: function(ctx) {
        if (!this._texture.loaded) {
            return;
        }
        var tDelta = meta.time.deltaF;
        var img = this.texture.canvas;
        var parentX = this.volume.minX - img.width * .5;
        var parentY = this.volume.minY - img.height * .5;
        if (this._textureAdditive) {
            ctx.globalCompositeOperation = "lighter";
        } else {
            ctx.globalCompositeOperation = "source-over";
        }
        var particle, color;
        for (var n = 0; n < this.numActive; n++) {
            particle = this.particles[n];
            color = particle.color;
            if (color[3] > 1) {
                color[3] = 1;
            }
            if (color[3] < 0) {
                color[3] = 0;
            }
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this._ctx.globalCompositeOperation = "source-over";
            this._ctx.globalAlpha = color[3];
            this._ctx.drawImage(img, 0, 0);
            this._ctx.globalCompositeOperation = "source-atop";
            this._ctx.fillStyle = "rgba(" + (color[0] | 0) + ", " + (color[1] | 0) + ", " + (color[2] | 0) + ", 1.0)";
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._ctx.globalCompositeOperation = "source-over";
            this._ctx.globalAlpha = color[3];
            ctx.drawImage(this.texture.canvas, parentX + particle.x, parentY + particle.y);
        }
    },
    play: function() {
        this.updating = true;
    },
    pause: function() {
        this.updating = false;
    },
    togglePlay: function() {
        if (this.updating) {
            this.pause();
        } else {
            this.play();
        }
    },
    reset: function() {
        this.numActive = 0;
        this.elapsed = 0;
    },
    set texture(value) {
        if (!value) {
            if (!this._svgTexture) {
                this._svgTexture = new Resource.SVG();
                this._svgTexture.fillStyle = "white";
                this._svgTexture.circle(this._radius);
            }
            this._texture = this._svgTexture;
        } else {
            this._texture = value;
        }
        if (this._texture.loaded) {
            this.updateTintCanvas();
        } else {
            this.texture.subscribe(this.onTextureEvent, this);
        }
    },
    get texture() {
        return this._texture;
    },
    updateTintCanvas: function() {
        if (!this._canvas) {
            this._canvas = document.createElement("canvas");
            this._ctx = this._canvas.getContext("2d");
        }
        this._canvas.width = this._texture.width;
        this._canvas.height = this._texture.height;
    },
    onTextureEvent: function(data, event) {
        this.updateTintCanvas();
        this._texture.unsubscribe(this);
    },
    set totalParticles(value) {
        var num = this.particles.length;
        this.particles.length = value;
        for (var n = num; n < value; n++) {
            this.particles[n] = new this.Particle();
        }
        if (this.numActive > value) {
            this.numActive = value;
        }
    },
    get totalParticles() {
        return this.particles.length;
    },
    set textureAdditive(value) {
        this._textureAdditive = value;
    },
    get textureAdditive() {
        return this._textureAdditive;
    },
    set textureTinting(value) {
        this._textureTinting = value;
    },
    get textureTinting() {
        return this._textureTinting;
    },
    set radius(value) {
        this._radius = value;
        if (this._texture === this._svgTexture) {
            this._svgTexture.clear();
            this._svgTexture.circle(this._radius);
            this.updateTintCanvas();
        }
    },
    get radius() {
        return this._radius;
    },
    set preset(name) {
        var preset = this.presets[name];
        for (var key in preset) {
            if (this[key] === preset[key]) {
                continue;
            }
            this[key] = preset[key];
        }
        this.textureAdditive = this._textureAdditive;
    },
    Particle: function() {
        this.life = 0;
        this.x = 0;
        this.y = 0;
        this.velX = 0;
        this.velY = 0;
        this.radialAccel = 0;
        this.tangentialAccel = 0;
        this.forcesX = 0;
        this.forcesY = 0;
        this.color = new Float32Array(4);
        this.colorDelta = new Float32Array(4);
        this.scale = 1;
        this.scaleDelta = 1;
    },
    particles: null,
    numActive: 0,
    emissionRate: 0,
    emissionCounter: 0,
    elapsed: 0,
    duration: Infinity,
    life: 1,
    lifeVar: 0,
    xVar: 0,
    yVar: 0,
    speed: 0,
    speedVar: 0,
    startAngle: 0,
    startAngleVar: 0,
    startScale: 1,
    startScaleVar: 0,
    endScale: 1,
    endScaleVar: 0,
    gravityX: 0,
    gravityY: 0,
    radialAccel: 0,
    radialAccelVar: 0,
    tangentialAccel: 0,
    tangentialAccelVar: 0,
    startColor: null,
    startColorVar: null,
    endColor: null,
    endColorVar: null,
    _endColor: new Float32Array(4),
    _canvas: null,
    _ctx: null,
    _svgTexture: null,
    _radius: 10,
    _textureAdditive: false,
    presets: {
        empty: {
            totalParticles: 50,
            emissionRate: 10,
            life: 1,
            lifeVar: 0
        },
        meteor: {
            totalParticles: 45,
            emissionRate: 40,
            life: 1,
            lifeVar: .1,
            xVar: 2,
            yVar: 2,
            speed: 15,
            speedVar: 5,
            angle: 90,
            angleVar: 360,
            gravityX: -200,
            gravityY: -200,
            radialAccel: 0,
            radialAccelVar: 0,
            tangentialAccel: 0,
            tangentialAccelVar: 0,
            startColor: [ 255, 42, 0, 1 ],
            startColorVar: [ 0, 0, 51, .1 ],
            endColor: [ 0, 0, 0, 1 ],
            endColorVar: [ 0, 0, 0, 0 ],
            scale: 1,
            scaleVar: 1,
            endScale: 1,
            endScaleVar: 1,
            textureAdditive: true,
            radius: 10
        }
    }
});

"use strict";

meta.component("Component.Anim", {
    set: function(texture) {
        if (!texture) {
            if (this.__index !== -1) {
                meta.renderer.removeAnim(this);
            }
            this.texture = null;
            return;
        }
        this.texture = texture;
        if (texture.frames > 1) {
            this.texture = texture;
            this.fps = texture.fps;
            this.__tAnim = 0;
            if (this.reverse) {
                this._frame = texture.frames - 1;
            } else {
                this._frame = 0;
            }
            if (this.autoPlay) {
                meta.renderer.addAnim(this);
            }
        } else if (this.__index !== -1) {
            meta.renderer.removeAnim(this);
        }
    },
    play: function(loop) {
        this.loop = loop || false;
        meta.renderer.addAnim(this);
    },
    pause: function() {
        meta.renderer.removeAnim(this);
    },
    resume: function() {
        meta.renderer.addAnim(this);
    },
    stop: function() {
        if (this.reverse) {
            this._frame = texture.frames - 1;
        } else {
            this._frame = 0;
        }
        meta.renderer.removeAnim(this);
    },
    reset: function() {
        if (this.reverse) {
            this._frame = texture.frames - 1;
        } else {
            this._frame = 0;
        }
        meta.renderer.addAnim(this);
    },
    onEnd: null,
    onCancel: null,
    update: function(tDelta) {
        this.__tAnim += tDelta;
        if (this.__tAnim < this.__delay) {
            return;
        }
        var frames = this.__tAnim / this.__delay | 0;
        this.__tAnim -= frames * this.__delay;
        if (!this.reverse) {
            this._frame += frames;
            if (this._frame >= this.texture.frames) {
                if (this.pauseLastFrame) {
                    meta.renderer.removeAnim(this);
                    this._frame = this.texture.frames - 1;
                } else if (!this.loop) {
                    meta.renderer.removeAnim(this);
                    this._frame = 0;
                } else {
                    this._frame = this._frame % this.texture.frames;
                }
                if (this.onEnd) {
                    this.onEnd.call(this.owner);
                }
            }
        } else {
            this._frame -= frames;
            if (this._frame < 0) {
                if (this.pauseLastFrame) {
                    meta.renderer.removeAnim(this);
                    this._frame = 0;
                } else if (!this.loop) {
                    meta.renderer.removeAnim(this);
                    this._frame = this.texture.frames - 1;
                } else {
                    this._frame = (this.texture.frames + this._frame) % this.texture.frames;
                }
                if (this.onEnd) {
                    this.onEnd.call(this.owner);
                }
            }
        }
        this.owner.renderer.needRender = true;
    },
    set frame(frame) {
        this._frame = frame;
        this.owner.renderer.needRender = true;
    },
    get frame() {
        return this._frame;
    },
    set fps(fps) {
        this._fps = fps;
        this.__delay = 1 / (fps * this._speed);
    },
    get fps() {
        return this._fps;
    },
    set speed(speed) {
        this._speed = speed;
        this.__delay = 1 / (fps * this._speed);
    },
    get speed() {
        return this._speed;
    },
    set paused(value) {
        if (value) {
            this.pause();
        } else {
            this.resume();
        }
    },
    get paused() {
        return true;
    },
    loop: true,
    reverse: false,
    autoPlay: true,
    pauseLastFrame: false,
    _fps: 0,
    _speed: 1,
    _frame: 0,
    __index: -1,
    __delay: 0,
    __tAnim: 0
});

"use strict";

meta.class("meta.Renderer", {
    init: function() {
        var view = meta.cache.view;
        this.holder = new Entity.Geometry();
        this.holder._view = view;
        this.staticHolder = new Entity.Geometry();
        this.staticHolder._view = view;
        var entityProto = Entity.Geometry.prototype;
        var flags = this.holder.Flag.ENABLED | this.holder.Flag.INSTANCE_ENABLED;
        entityProto.flags = flags;
        entityProto.renderer = this;
        entityProto.parent = this.holder;
        this.holder.flags = flags;
        this.staticHolder.flags = flags;
        this.entities = [];
        this.entitiesHidden = [];
        this.entitiesRemove = [];
        if (meta.flags.culling) {
            this.culling = new meta.SparseGrid();
        }
        this.onRenderDebug = meta.createChannel(meta.Event.RENDER_DEBUG);
    },
    load: function() {
        this.engine = meta.engine;
        this.camera = meta.camera;
        this.cameraVolume = this.camera.volume;
        this.cameraDefault = this.camera;
        this.chn = {
            onDown: meta.createChannel(Entity.Event.INPUT_DOWN),
            onUp: meta.createChannel(Entity.Event.INPUT_UP),
            onClick: meta.createChannel(Entity.Event.CLICK),
            onDbClick: meta.createChannel(Entity.Event.DBCLICK),
            onDrag: meta.createChannel(Entity.Event.DRAG),
            onDragStart: meta.createChannel(Entity.Event.DRAG_START),
            onDragEnd: meta.createChannel(Entity.Event.DRAG_END),
            onHover: meta.createChannel(Entity.Event.HOVER),
            onHoverEnter: meta.createChannel(Entity.Event.HOVER_ENTER),
            onHoverExit: meta.createChannel(Entity.Event.HOVER_EXIT)
        };
        meta.input.onDown.add(this.onInputDown, this, meta.Priority.HIGH);
        meta.input.onUp.add(this.onInputUp, this, meta.Priority.HIGH);
        meta.input.onMove.add(this.onInputMove, this, meta.Priority.HIGH);
        meta.input.onDbClick.add(this.onInputDbClick, this, meta.Priority.HIGH);
        meta.engine.onAdapt.add(this.onAdapt, this);
        meta.camera.onResize.add(this.onCameraResize, this);
        meta.camera.onMove.add(this.onCameraMove, this);
        this.holder.resize(this.camera.volume.width, this.camera.volume.height);
        if (this.culling) {
            this.culling.calc();
        }
    },
    prevNum: 0,
    update: function(tDelta) {
        if (this.entitiesRemove.length > 0) {
            this._removeEntities(this.entitiesRemove);
            this.entitiesRemove.length = 0;
        }
        this._removeUpdateEntities();
        this._removeAnimEntities();
        this._removePickingEntities();
        this._removeTweens();
        this.__updating = true;
        var num = this.entitiesUpdate.length;
        for (var i = 0; i < num; i++) {
            this.entitiesUpdate[i].update(tDelta);
        }
        num = this.tweens.length;
        for (i = 0; i < num; i++) {
            this.tweens[i].update(tDelta);
        }
        this.__updating = false;
        if (this.needSortDepth) {
            this.sort();
        }
    },
    render: function(tDelta) {
        this.renderMain(tDelta);
        if (this.needRender) {
            var debug = this.meta.cache.debug || this.numDebug > 0;
            if (debug) {
                this.renderDebug();
                this.onRenderDebug.emit(this);
            }
            this.renderStatic();
            this.needRender = false;
        }
    },
    _removeEntities: function(entities) {
        this._removeStartID = Number.MAX_SAFE_INTEGER;
        this._removeEntitiesGroup(entities);
        var value;
        for (var n = this._removeStartID + 1; n < this.numEntities; n++) {
            value = this.entities[n];
            if (value) {
                this.entities[this._removeStartID++] = value;
            }
        }
        this.numEntities -= this._numRemove;
        this.entities.length = this.numEntities;
        this._numRemove = 0;
        this.needRender = true;
    },
    _removeEntitiesGroup: function(entities) {
        var entity, n;
        var numRemove = entities.length;
        for (var i = 0; i < numRemove; i++) {
            entity = entities[i];
            if (!entity) {
                continue;
            }
            for (n = 0; n < this.numEntities; n++) {
                if (this.entities[n] === entity) {
                    this.entities[n] = null;
                    this._numRemove++;
                    if (n < this._removeStartID) {
                        this._removeStartID = n;
                    }
                    break;
                }
            }
            if ((entity.flags & entity.Flag.ACTIVE) === 0) {
                if (entity.__updateIndex !== -1) {
                    this.entitiesUpdateRemove.push(entity);
                    entity.__updateIndex = -1;
                }
                entity._deactivate();
            }
            if (entity.__pickIndex !== -1) {
                this.entitiesPickingRemove.push(entity);
                entity.__pickIndex = -1;
            }
            if (entity.children) {
                this._removeEntitiesGroup(entity.children);
            }
            if (entity.flags & entity.Flag.REMOVED) {
                entity._remove();
            }
            entity.flags &= ~entity.Flag.RENDER_REMOVE;
        }
    },
    _removeUpdateEntities: function() {
        var numRemove = this.entitiesUpdateRemove.length;
        if (numRemove > 0) {
            var numEntities = this.entitiesUpdate.length;
            var itemsLeft = numEntities - numRemove;
            if (itemsLeft > 0) {
                var index;
                for (var i = 0; i < numRemove; i++) {
                    index = this.entitiesUpdate.indexOf(this.entitiesUpdateRemove[i]);
                    if (index < itemsLeft) {
                        this.entitiesUpdate.splice(index, 1);
                    } else {
                        this.entitiesUpdate.pop();
                    }
                }
            } else {
                this.entitiesUpdate.length = 0;
            }
            this.entitiesUpdateRemove.length = 0;
        }
    },
    _removeAnimEntities: function() {
        var numRemove = this.entitiesAnimRemove.length;
        if (numRemove > 0) {
            var numEntities = this.entitiesAnim.length;
            var itemsLeft = numEntities - numRemove;
            if (itemsLeft > 0) {
                var index;
                for (var i = 0; i < numRemove; i++) {
                    index = this.entitiesAnim.indexOf(this.entitiesAnimRemove[i]);
                    if (index < itemsLeft) {
                        this.entitiesAnim.splice(index, 1);
                    } else {
                        this.entitiesAnim.pop();
                    }
                }
            } else {
                this.entitiesAnim.length = 0;
            }
            this.entitiesAnimRemove.length = 0;
        }
    },
    _removePickingEntities: function() {
        var numRemove = this.entitiesPickingRemove.length;
        if (numRemove === 0) {
            return;
        }
        var numEntities = this.entitiesPicking.length;
        var itemsLeft = numEntities - numRemove;
        if (itemsLeft > 0) {
            var n, entity;
            var startID = Number.MAX_SAFE_INTEGER;
            for (var i = 0; i < numRemove; i++) {
                entity = this.entitiesPickingRemove[i];
                for (n = 0; n < numEntities; n++) {
                    if (this.entitiesPicking[n] === entity) {
                        this.entitiesPicking[n] = null;
                        if (n < startID) {
                            startID = n;
                        }
                        break;
                    }
                }
            }
            var value;
            for (n = startID + 1; n < numEntities; n++) {
                value = this.entitiesPicking[n];
                if (value) {
                    this.entitiesPicking[startID++] = value;
                }
            }
            this.entitiesPicking.length = itemsLeft;
        } else {
            this.entitiesPicking.length = 0;
        }
        this.entitiesPickingRemove.length = 0;
    },
    _removeTweens: function() {
        var numRemove = this.tweensRemove.length;
        if (numRemove > 0) {
            var numTweens = this.tweens.length;
            var itemsLeft = numTweens - numRemove;
            if (itemsLeft > 0) {
                var index;
                for (var i = 0; i < numRemove; i++) {
                    index = this.tweens.indexOf(this.tweensRemove[i]);
                    if (index < itemsLeft) {
                        this.tweens.splice(index, 1);
                    } else {
                        this.tweens.pop();
                    }
                }
            } else {
                this.tweens.length = 0;
            }
            this.tweensRemove.length = 0;
        }
    },
    sort: function() {
        var i, j, tmp1, tmp2;
        var num = this.numEntities;
        for (i = 0; i < num; i++) {
            for (j = i; j > 0; j--) {
                tmp1 = this.entities[j];
                tmp2 = this.entities[j - 1];
                if (tmp1.totalZ < tmp2.totalZ) {
                    this.entities[j] = tmp2;
                    this.entities[j - 1] = tmp1;
                }
            }
        }
        num = this.entitiesPicking.length;
        for (i = 0; i < num; i++) {
            for (j = i; j > 0; j--) {
                tmp1 = this.entitiesPicking[j];
                tmp2 = this.entitiesPicking[j - 1];
                if (tmp1.totalZ < tmp2.totalZ) {
                    this.entitiesPicking[j] = tmp2;
                    this.entitiesPicking[j - 1] = tmp1;
                }
            }
        }
        this.needSortDepth = false;
        this.needRender = true;
    },
    makeEntityVisible: function(entity) {
        if (entity.flags & entity.Flag.RENDER) {
            return;
        }
        entity.flags |= entity.Flag.RENDER;
        if (entity.flags & entity.Flag.RENDER_REMOVE) {
            var index = this.entitiesRemove.indexOf(entity);
            this.entitiesRemove[index] = null;
            entity.flags &= ~entity.Flag.RENDER_REMOVE;
        } else {
            if (entity.flags & entity.Flag.PICKING) {
                this.entitiesPicking.push(entity);
            }
            this.entities.push(entity);
            this.numEntities++;
        }
        this.needSortDepth = true;
        this.needRender = true;
    },
    makeEntityInvisible: function(entity) {
        if ((entity.flags & entity.Flag.RENDER) === 0) {
            return;
        }
        entity.flags &= ~entity.Flag.RENDER;
        entity.flags |= entity.Flag.RENDER_REMOVE;
        this.entitiesRemove.push(entity);
    },
    addEntity: function(entity, reuse) {
        if ((entity.flags & entity.Flag.INSTANCE_ENABLED) === 0) {
            return;
        }
        entity._activate();
        if (this.culling) {
            this.culling.add(entity);
        } else {
            this.makeEntityVisible(entity);
        }
        if (entity.children) {
            var children = entity.children;
            var num = children.length;
            for (var n = 0; n < num; n++) {
                this.addEntity(children[n], reuse);
            }
        }
    },
    addEntities: function(entities) {
        var numEntities = entities.length;
        for (var n = 0; n < numEntities; n++) {
            this.addEntity(entities[n], false);
        }
    },
    removeEntity: function(entity) {
        if ((entity.flags & entity.Flag.ACTIVE) === 0) {
            return;
        }
        if (entity.flags & entity.Flag.RENDER_REMOVE) {
            return;
        }
        entity.flags &= ~(entity.Flag.ACTIVE | entity.Flag.RENDER);
        entity.flags |= entity.Flag.RENDER_REMOVE;
        this.entitiesRemove.push(entity);
    },
    removeEntities: function(entities) {
        var numRemove = entities.length;
        for (var i = 0; i < numRemove; i++) {
            this.removeEntity(entities[i]);
        }
    },
    addAnim: function(anim) {
        if (anim.__index !== -1) {
            return;
        }
        anim.__index = this.entitiesAnim.push(anim) - 1;
    },
    removeAnim: function(anim) {
        if (anim.__index === -1) {
            return;
        }
        this.entitiesAnimRemove.push(anim);
        anim.__index = -1;
    },
    onInputDown: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        if (!this.hoverEntity) {
            return;
        }
        data.entity = this.hoverEntity;
        this.pressedEntity = this.hoverEntity;
        this.pressedEntity.pressed = true;
        if (this.pressedEntity.onDown) {
            this.pressedEntity.onDown.call(this.pressedEntity, data);
        }
        this.chn.onDown.emit(data, Entity.Event.INPUT_DOWN);
    },
    onInputUp: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        if (this.pressedEntity) {
            data.entity = this.hoverEntity;
            this.pressedEntity.pressed = false;
            if (this.pressedEntity.onUp) {
                this.pressedEntity.onUp.call(this.pressedEntity, event);
            }
            this.chn.onUp.emit(this.pressedEntity, Entity.Event.INPUT_UP);
            this._checkHover(data);
            if (this.pressedEntity === this.hoverEntity) {
                if (this.pressedEntity.onClick) {
                    this.pressedEntity.onClick.call(this.pressedEntity, data);
                }
                this.chn.onClick.emit(data, Entity.Event.CLICK);
            }
            if (this.pressedEntity.dragged) {
                data.entity = this.pressedEntity;
                this.pressedEntity.dragged = false;
                if (this.pressedEntity.onDragEnd) {
                    this.pressedEntity.onDragEnd.call(this.pressedEntity, data);
                }
                this.chn.onDragEnd.emit(data, Entity.Event.DRAG_END);
                data.entity = this.hoverEntity;
            }
            this.pressedEntity = null;
        }
    },
    onInputMove: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        if (!this._checkDrag(data)) {
            data.entity = this.hoverEntity;
            return;
        }
        data.entity = this.hoverEntity;
    },
    onInputDbClick: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        if (this.hoverEntity) {
            data.entity = this.hoverEntity;
            if (this.hoverEntity.onDbClick) {
                this.hoverEntity.onDbClick.call(this.hoverEntity, data);
            }
            this.chn.onDbClick.emit(data, Entity.Event.DBCLICK);
        } else {
            data.entity = null;
        }
    },
    _checkHover: function(data) {
        var entity;
        var numEntities = this.entitiesPicking.length;
        for (var i = numEntities - 1; i >= 0; i--) {
            entity = this.entitiesPicking[i];
            if (entity.flags & entity.Flag.INSTANCE_HIDDEN) {
                continue;
            }
            if (this.enablePixelPicking) {
                if (entity._static) {
                    if (!entity.isPointInsidePx(data.screenX, data.screenY)) {
                        continue;
                    }
                } else {
                    if (!entity.isPointInsidePx(data.x, data.y)) {
                        continue;
                    }
                }
            } else {
                if (entity._static) {
                    if (!entity.isPointInside(data.screenX, data.screenY)) {
                        continue;
                    }
                } else {
                    if (!entity.isPointInside(data.x, data.y)) {
                        continue;
                    }
                }
            }
            if (this.hoverEntity !== entity) {
                if (this.hoverEntity) {
                    data.entity = this.hoverEntity;
                    this.hoverEntity.hover = false;
                    if (this.hoverEntity.onHoverExit) {
                        this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
                    }
                    this.chn.onHoverExit.emit(data, Entity.Event.HOVER_EXIT);
                }
                data.entity = entity;
                entity.hover = true;
                if (entity.onHoverEnter) {
                    entity.onHoverEnter.call(entity, data);
                }
                this.chn.onHoverEnter.emit(data, Entity.Event.HOVER_ENTER);
                this.hoverEntity = entity;
            } else {
                data.entity = entity;
                if (entity.onHover) {
                    entity.onHover.call(entity, data);
                }
                this.chn.onHover.emit(data, Entity.Event.HOVER);
            }
            data.entity = null;
            return;
        }
        if (this.hoverEntity) {
            data.entity = this.hoverEntity;
            this.hoverEntity.hover = false;
            if (this.hoverEntity.onHoverExit) {
                this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
            }
            this.chn.onHoverExit.emit(data, Entity.Event.HOVER_EXIT);
        }
        this.hoverEntity = null;
    },
    _checkDrag: function(data) {
        if (this.pressedEntity) {
            data.entity = this.pressedEntity;
            if (!this.pressedEntity.dragged) {
                this.pressedEntity.dragged = true;
                if (this.pressedEntity.onDragStart) {
                    this.pressedEntity.onDragStart.call(this.pressedEntity, data);
                }
                this.chn.onDragStart.emit(data, Entity.Event.DRAG_START);
            } else {
                if (this.pressedEntity.onDrag) {
                    this.pressedEntity.onDrag.call(this.pressedEntity, data);
                }
                this.chn.onDrag.emit(data, Entity.Event.DRAG);
            }
            return false;
        }
        return true;
    },
    onCameraResize: function(data, event) {
        this.holder.resize(data.width, data.height);
        this.staticHolder.resize(this.engine.width, this.engine.height);
        if (this.culling) {
            this.culling.calc();
        }
    },
    onCameraMove: function(data, event) {
        if (this.culling) {
            this.culling.calc();
        }
        this.needRender = true;
    },
    onAdapt: function(data, event) {},
    getUniqueID: function() {
        return this.__uniqueID++;
    },
    set bgColor(hex) {
        this._bgColor = hex;
        this.updateBgColor();
        this.needRender = true;
    },
    get bgColor() {
        return this._bgColor;
    },
    set transparent(value) {
        this._transparent = value;
        this.updateBgColor();
        this.needRender = true;
    },
    get transparent() {
        return this._transparent;
    },
    addRender: function(owner) {
        this._renderFuncs.push(owner);
    },
    removeRender: function(owner) {
        var length = this._renderFuncs.length;
        for (var i = 0; i < length; i++) {
            if (this._renderFuncs[i] === owner) {
                this._renderFuncs[i] = this._renderFuncs[length - 1];
                this._renderFuncs.pop();
                break;
            }
        }
    },
    onRenderDebug: null,
    meta: meta,
    engine: null,
    chn: null,
    culling: null,
    holder: null,
    staticHolder: null,
    camera: null,
    cameraVolume: null,
    cameraDefault: null,
    cameraUI: null,
    _numRemove: 0,
    _removeStartID: 0,
    entities: null,
    entitiesHidden: null,
    entitiesRemove: null,
    numEntities: 0,
    entitiesUpdate: [],
    entitiesUpdateRemove: [],
    entitiesAnim: [],
    entitiesAnimRemove: [],
    entitiesPicking: [],
    entitiesPickingRemove: [],
    hoverEntity: null,
    pressedEntity: null,
    enablePicking: true,
    enablePixelPicking: false,
    tweens: [],
    tweensRemove: [],
    needRender: true,
    needSortDepth: false,
    useSparseGrid: false,
    _renderFuncs: [],
    currZ: 0,
    numDebug: 0,
    _bgColor: "#ddd",
    _transparent: false,
    __uniqueID: 0,
    __updating: false
});

"use strict";

meta.class("meta.CanvasRenderer", "meta.Renderer", {
    init: function() {
        this._super();
        this.ctx = meta.engine.canvas.getContext("2d");
        meta.engine.ctx = this.ctx;
    },
    renderMain: function(tDelta) {
        var numEntities = this.entitiesAnim.length;
        for (var i = 0; i < numEntities; i++) {
            this.entitiesAnim[i].update(tDelta);
        }
        if (!this.needRender) {
            return;
        }
        this.clear();
        this.ctx.save();
        var zoom = this.camera._zoom;
        this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));
        var entity;
        var entityFlag = this.holder.Flag;
        for (i = 0; i < this.numEntities; i++) {
            entity = this.entities[i];
            if (entity.flags & entityFlag.INSTANCE_HIDDEN) {
                continue;
            }
            this.drawEntity(entity);
        }
        var numFuncs = this._renderFuncs.length;
        for (i = 0; i < numFuncs; i++) {
            this._renderFuncs[i].render(tDelta);
        }
    },
    renderDebug: function() {
        if (this.culling) {
            this.culling.drawDebug(this.ctx);
        }
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "red";
        this.ctx.fillStyle = "red";
        var entity;
        var entityFlag = this.holder.Flag;
        for (var n = 0; n < this.numEntities; n++) {
            entity = this.entities[n];
            if (entity.flags & entityFlag.INSTANCE_HIDDEN) {
                continue;
            }
            if (entity.flags & entityFlag.DEBUG || this.meta.cache.debug) {
                this.drawVolume(entity);
            }
        }
    },
    renderStatic: function() {
        this.ctx.restore();
    },
    clear: function() {
        if (this._transparent) {
            this.ctx.clearRect(0, 0, this.engine.width, this.engine.height);
        } else {
            this.ctx.fillStyle = this._bgColor;
            this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);
        }
    },
    drawEntity: function(entity) {
        if (entity._static) {
            var zoom = this.camera._zoom;
            if (entity._debugger) {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                this.ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
            }
            if (entity.draw) {
                this.ctx.save();
                entity.draw(this.ctx);
                this.ctx.restore();
            } else {
                this._drawEntity(entity);
            }
            this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));
        } else {
            if (entity.draw) {
                this.ctx.save();
                entity.draw(this.ctx);
                this.ctx.restore();
            } else {
                this._drawEntity(entity);
            }
        }
    },
    _drawEntity: function(entity) {
        var texture = entity._texture;
        if (!texture || !entity._texture._loaded) {
            return;
        }
        var volume = entity.volume;
        var anim = entity.anim;
        if (entity.clipVolume) {
            this.ctx.save();
            this.ctx.beginPath();
            if (entity.flags & entity.Flag.CLIP_BOUNDS) {
                this.ctx.rect(Math.floor(entity.volume.minX), Math.floor(entity.volume.minY), entity.clipVolume.width, entity.clipVolume.height);
            } else {
                this.ctx.rect(Math.floor(entity.clipVolume.minX), Math.floor(entity.clipVolume.minY), entity.clipVolume.width, entity.clipVolume.height);
            }
            this.ctx.closePath();
            this.ctx.clip();
        }
        if (entity.flags & entity.Flag.DYNAMIC_CLIP) {
            if (volume.width > 0 && volume.height > 0) {
                this.ctx.drawImage(texture.canvas, 0, 0, volume.width, volume.height, Math.floor(volume.minX), Math.floor(volume.minY), volume.width, volume.height);
            }
            return;
        }
        if (!volume.__transformed) {
            if (texture.frames > 1) {
                texture.drawFrame(this.ctx, Math.floor(volume.minX), Math.floor(volume.minY), anim._frame);
            } else {
                if (texture.fromAtlas) {
                    this.ctx.drawImage(texture.ptr.canvas, texture.x, texture.y, texture.fullWidth, texture.fullHeight, Math.floor(volume.minX), Math.floor(volume.minY), texture.fullWidth, texture.fullHeight);
                } else {
                    this.ctx.drawImage(texture.canvas, Math.floor(volume.minX), Math.floor(volume.minY));
                }
            }
        } else {
            this.ctx.globalAlpha = entity.totalAlpha;
            this.ctx.transform(volume.m11, volume.m12, volume.m21, volume.m22, Math.floor(volume.x), Math.floor(volume.y));
            if (texture.frames > 1) {
                texture.drawFrame(this.ctx, -volume.initPivotPosX, -volume.initPivotPosY, anim._frame);
            } else {
                if (texture.fromAtlas) {
                    this.ctx.drawImage(texture.ptr.canvas, texture.x, texture.y, texture.fullWidth, texture.fullHeight, -volume.initPivotPosX, -volume.initPivotPosY, texture.fullWidth, texture.fullHeight);
                } else {
                    this.ctx.drawImage(texture.canvas, -volume.initPivotPosX, -volume.initPivotPosY);
                }
            }
            this.ctx.globalAlpha = 1;
            var zoom = this.camera._zoom;
            this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.camera.volume.x * zoom), -Math.floor(this.camera.volume.y * zoom));
        }
        if (entity.clipVolume) {
            this.ctx.restore();
        }
    },
    drawVolume: function(entity) {
        if (entity._view.debugger) {
            return;
        }
        var volume = entity.volume;
        if (volume.__type === 0) {
            this._drawVolume(volume);
        } else {
            this.ctx.save();
            this.ctx.translate(Math.floor(volume.x), Math.floor(volume.y));
            this.ctx.rotate(entity.volume.angle);
            this.ctx.translate(-Math.floor(volume.x), -Math.floor(volume.y));
            this._drawVolume(volume);
            this.ctx.restore();
        }
    },
    _drawVolume: function(volume) {
        var minX = Math.floor(volume.minX);
        var minY = Math.floor(volume.minY);
        var maxX = Math.ceil(volume.maxX);
        var maxY = Math.ceil(volume.maxY);
        this.ctx.beginPath();
        this.ctx.moveTo(minX, minY);
        this.ctx.lineTo(maxX, minY);
        this.ctx.lineTo(maxX, maxY);
        this.ctx.lineTo(minX, maxY);
        this.ctx.lineTo(minX, minY - 1);
        this.ctx.stroke();
        this.ctx.fillRect(Math.floor(volume.x) - 3, Math.floor(volume.y) - 3, 6, 6);
    },
    updateBgColor: function() {}
});

"use strict";

meta.SparseGrid = function() {
    this.cells = [];
    this.cellWidth = meta.flags.cullingWidth || 512;
    this.cellHeight = meta.flags.cullingHeight || 512;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.newMinX = 0;
    this.newMinY = 0;
    this.newMaxX = 0;
    this.newMaxY = 0;
};

meta.SparseGrid.prototype = {
    calc: function() {
        var cameraVolume = meta.camera.volume;
        var startX = Math.floor(cameraVolume.minX / this.cellWidth);
        var startY = Math.floor(cameraVolume.minY / this.cellHeight);
        var endX = Math.floor(cameraVolume.maxX / this.cellWidth);
        var endY = Math.floor(cameraVolume.maxY / this.cellHeight);
        if (startX === this.startX && startY === this.startY && endX === this.endX && endY === this.endY) {
            return;
        }
        var uid, cell, x, y;
        if (startX > this.endX || endX < this.startX || startY > this.endY || endY < this.startY) {
            for (y = this.startY; y <= this.endY; y++) {
                for (x = this.startX; x <= this.endX; x++) {
                    uid = x << 16 | y & 65535;
                    cell = this.cells[uid];
                    if (!cell) {
                        continue;
                    }
                    cell.visible = 0;
                    this.makeInvisible(cell.data);
                }
            }
            for (y = startY; y <= endY; y++) {
                for (x = startX; x <= endX; x++) {
                    uid = x << 16 | y & 65535;
                    cell = this.cells[uid];
                    if (!cell) {
                        continue;
                    }
                    cell.visible = 1;
                    this.makeVisible(cell.data);
                }
            }
        } else {
            var minX = startX < this.startX ? startX : this.startX;
            var minY = startY < this.startY ? startY : this.startY;
            var maxX = endX > this.endX ? endX : this.endX;
            var maxY = endY > this.endY ? endY : this.endY;
            for (var y = minY; y <= maxY; y++) {
                for (var x = minX; x <= maxX; x++) {
                    if (x >= startX && x <= endX && y >= startY && y <= endY) {
                        if (x < this.startX || x > this.endX || y < this.startY || y > this.endY) {
                            uid = x << 16 | y & 65535;
                            cell = this.cells[uid];
                            if (!cell) {
                                continue;
                            }
                            cell.visible = 1;
                            this.makeVisible(cell.data);
                        }
                    } else {
                        uid = x << 16 | y & 65535;
                        cell = this.cells[uid];
                        if (!cell) {
                            continue;
                        }
                        if (cell.visible) {
                            cell.visible = 0;
                            this.makeInvisible(cell.data);
                        }
                    }
                }
            }
        }
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
    },
    makeVisible: function(entities) {
        var renderer = meta.renderer;
        var entity;
        var num = entities.length;
        for (var n = 0; n < num; n++) {
            entity = entities[n];
            if (entity.node.numVisible === 0) {
                renderer.makeEntityVisible(entity);
            }
            entity.node.numVisible++;
        }
    },
    makeInvisible: function(entities) {
        var renderer = meta.renderer;
        var entity;
        var num = entities.length;
        for (var n = 0; n < num; n++) {
            entity = entities[n];
            entity.node.numVisible--;
            if (entity.node.numVisible === 0) {
                renderer.makeEntityInvisible(entity);
            }
        }
    },
    add: function(entity) {
        var node = entity.node;
        var volume = entity.volume;
        this.calcBounds(volume);
        var cell, uid;
        for (var y = this.newMinY; y <= this.newMaxY; y++) {
            for (var x = this.newMinX; x <= this.newMaxX; x++) {
                uid = x << 16 | y & 65535;
                cell = this.cells[uid];
                if (!cell) {
                    cell = new this.Cell();
                    cell.data.push(entity);
                    this.cells[uid] = cell;
                    if (x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
                        cell.visible = 1;
                        node.numVisible++;
                    }
                } else {
                    cell.data.push(entity);
                    if (cell.visible) {
                        node.numVisible++;
                    }
                }
            }
        }
        node.minX = this.newMinX;
        node.minY = this.newMinY;
        node.maxX = this.newMaxX;
        node.maxY = this.newMaxY;
        if (node.numVisible > 0) {
            meta.renderer.makeEntityVisible(entity);
        }
    },
    remove: function(entity) {
        var volume = entity.volume;
        var node = entity.node;
        var data, uid, n, num;
        for (var y = node.minY; y < node.maxY; y++) {
            for (var x = node.minX; x < node.maxX; x++) {
                uid = x << 16 | y & 65535;
                data = this.cells[uid].data;
                num = data.length;
                for (n = 0; n < num; n++) {
                    if (data[n] === entity) {
                        data[n] = data[num - 1];
                        data.pop();
                        break;
                    }
                }
            }
        }
        node.minX = 0;
        node.minY = 0;
        node.maxX = 0;
        node.maxY = 0;
        if (entity.node.numVisible > 0) {
            entity.node.numVisible = 0;
            meta.renderer.makeEntityInvisible(entity);
        }
    },
    update: function(entity) {
        if ((entity.flags & entity.Flag.ACTIVE) === 0) {
            return;
        }
        var node = entity.node;
        var volume = entity.volume;
        this.calcBounds(volume);
        if (node.minX === this.newMinX && node.minY === this.newMinY && node.maxX === this.newMaxX && node.maxY === this.newMaxY) {
            return;
        }
        var cell, data, uid, index, y, x;
        var prevNumVisible = node.numVisible;
        if (node.minX > this.newMaxX || node.maxX < this.newMinX || node.minY > this.newMaxY || node.maxY < this.newMinY) {
            for (y = node.minY; y <= node.maxY; y++) {
                for (x = node.minX; x <= node.maxX; x++) {
                    uid = x << 16 | y & 65535;
                    data = this.cells[uid].data;
                    index = data.indexOf(entity);
                    data[index] = data[data.length - 1];
                    data.pop();
                }
            }
            node.numVisible = 0;
            for (y = this.newMinY; y <= this.newMaxY; y++) {
                for (x = this.newMinX; x <= this.newMaxX; x++) {
                    uid = x << 16 | y & 65535;
                    cell = this.cells[uid];
                    if (!cell) {
                        cell = new this.Cell();
                        cell.data.push(entity);
                        this.cells[uid] = cell;
                        if (x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
                            cell.visible = 1;
                            node.numVisible++;
                        }
                    } else {
                        cell.data.push(entity);
                        if (cell.visible) {
                            node.numVisible++;
                        }
                    }
                }
            }
        } else {
            var minX = this.newMinX < node.minX ? this.newMinX : node.minX;
            var minY = this.newMinY < node.minY ? this.newMinY : node.minY;
            var maxX = this.newMaxX > node.maxX ? this.newMaxX : node.maxX;
            var maxY = this.newMaxY > node.maxY ? this.newMaxY : node.maxY;
            for (y = minY; y <= maxY; y++) {
                for (x = minX; x <= maxX; x++) {
                    if (x >= node.minX && x <= node.maxX && y >= node.minY && y <= node.maxY) {
                        if (x > this.newMaxX || x < this.newMinX || y > this.newMaxY || y < this.newMinY) {
                            uid = x << 16 | y & 65535;
                            cell = this.cells[uid];
                            data = cell.data;
                            index = data.indexOf(entity);
                            data[index] = data[data.length - 1];
                            data.pop();
                            if (x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
                                cell.visible = 1;
                                node.numVisible--;
                            }
                        }
                    } else {
                        uid = x << 16 | y & 65535;
                        cell = this.cells[uid];
                        if (!cell) {
                            cell = new this.Cell();
                            cell.data.push(entity);
                            this.cells[uid] = cell;
                            if (x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
                                cell.visible = 1;
                                node.numVisible++;
                            }
                        } else {
                            cell.data.push(entity);
                            if (cell.visible) {
                                node.numVisible++;
                            }
                        }
                    }
                }
            }
        }
        if (node.numVisible === 0) {
            if (prevNumVisible > 0) {
                meta.renderer.makeEntityInvisible(entity);
            }
        } else {
            if (prevNumVisible === 0) {
                meta.renderer.makeEntityVisible(entity);
            }
        }
        node.minX = this.newMinX;
        node.minY = this.newMinY;
        node.maxX = this.newMaxX;
        node.maxY = this.newMaxY;
    },
    calcBounds: function(volume) {
        if (volume.angle !== 0) {
            var sin = volume.sin;
            var cos = volume.cos;
            var px = volume.x + -volume.pivotPosX * cos - -volume.pivotPosY * sin;
            var py = volume.y + -volume.pivotPosX * sin + -volume.pivotPosY * cos;
            var widthCos = volume.width * cos;
            var heightCos = volume.height * cos;
            var widthSin = volume.width * sin;
            var heightSin = volume.height * sin;
            if (volume.angle < Math.PI) {
                if (volume.angle < 1.5707963267948966) {
                    minX = px - heightSin;
                    maxX = px + widthCos;
                    minY = py;
                    maxY = py + heightCos + widthSin;
                } else {
                    minX = px - heightSin + widthCos;
                    maxX = px;
                    minY = py + heightCos;
                    maxY = py + widthSin;
                }
            } else {
                if (volume.angle < 4.71238898038469) {
                    minX = px + widthCos;
                    maxX = px - heightSin;
                    minY = py + widthSin + heightCos;
                    maxY = py;
                } else {
                    minX = px;
                    maxX = px + widthCos - heightSin;
                    minY = py + widthSin;
                    maxY = py + heightCos;
                }
            }
            this.newMinX = Math.floor(minX / this.cellWidth);
            this.newMinY = Math.floor(minY / this.cellHeight);
            this.newMaxX = Math.floor(maxX / this.cellWidth);
            this.newMaxY = Math.floor(maxY / this.cellHeight);
        } else {
            this.newMinX = Math.floor(volume.minX / this.cellWidth);
            this.newMinY = Math.floor(volume.minY / this.cellHeight);
            this.newMaxX = Math.floor(volume.maxX / this.cellWidth);
            this.newMaxY = Math.floor(volume.maxY / this.cellHeight);
        }
    },
    drawDebug: function(ctx) {
        if (!this.debug) {
            return;
        }
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#43a6e2";
        ctx.fillStyle = "#c9e3f3";
        var posX, posY, uid, cell;
        for (var y = this.startY; y <= this.endY; y++) {
            for (var x = this.startX; x <= this.endX; x++) {
                posX = x * this.cellWidth + .5;
                posY = y * this.cellHeight + .5;
                ctx.beginPath();
                ctx.rect(posX, posY, this.cellWidth, this.cellHeight);
                ctx.stroke();
            }
        }
        ctx.restore();
    },
    Cell: function() {
        this.data = [];
        this.visible = 0;
    },
    debug: true
};

meta.SparseNode = function(owner) {
    this.owner = owner;
    this.numVisible = 0;
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
};

"use strict";

meta.controller("meta.debugger", {
    onFirstLoad: function() {
        this.view.static = true;
        this.view.debugger = true;
        this.view.z = 1e6;
        var texture = new Resource.SVG();
        texture.fillRect(0, 0, 200, 290);
        this.holder = new Entity.Geometry(texture);
        this.holder.anchor(0, 1);
        this.holder.pivot(0, 1);
        this.view.attach(this.holder);
        var fps = new Entity.Text();
        fps.position(10, 10);
        fps.text = "fps: 60";
        this.holder.attach(fps);
        var memory = new Entity.Text();
        memory.position(10, 25);
        this.holder.attach(memory);
        var entities = new Entity.Text();
        entities.position(10, 40);
        entities.text = "entities: 0";
        this.holder.attach(entities);
        var resolution = new Entity.Text();
        resolution.position(10, 65);
        this.holder.attach(resolution);
        var worldInfo = new Entity.Text();
        worldInfo.text = "world:";
        worldInfo.position(10, 90);
        this.holder.attach(worldInfo);
        var worldBoundsMin = new Entity.Text();
        worldBoundsMin.position(20, 105);
        this.holder.attach(worldBoundsMin);
        var worldBoundsMax = new Entity.Text();
        worldBoundsMax.position(20, 120);
        this.holder.attach(worldBoundsMax);
        var worldResolution = new Entity.Text();
        worldResolution.position(20, 135);
        this.holder.attach(worldResolution);
        var cameraInfo = new Entity.Text();
        cameraInfo.text = "camera:";
        cameraInfo.position(10, 155);
        this.holder.attach(cameraInfo);
        var cameraBoundsMin = new Entity.Text();
        cameraBoundsMin.position(20, 170);
        this.holder.attach(cameraBoundsMin);
        var cameraBoundsMax = new Entity.Text();
        cameraBoundsMax.position(20, 185);
        this.holder.attach(cameraBoundsMax);
        var cameraResolution = new Entity.Text();
        cameraResolution.position(20, 200);
        this.holder.attach(cameraResolution);
        var cameraZoom = new Entity.Text();
        cameraZoom.position(20, 215);
        this.holder.attach(cameraZoom);
        var cursorInfo = new Entity.Text();
        cursorInfo.text = "cursor:";
        cursorInfo.position(10, 235);
        this.holder.attach(cursorInfo);
        var world = new Entity.Text();
        world.position(20, 250);
        this.holder.attach(world);
        var screen = new Entity.Text();
        screen.position(20, 265);
        this.holder.attach(screen);
        this.txt = {
            fps: fps,
            memory: memory,
            entities: entities,
            resolution: resolution,
            worldBoundsMin: worldBoundsMin,
            worldBoundsMax: worldBoundsMax,
            worldResolution: worldResolution,
            cameraBoundsMin: cameraBoundsMin,
            cameraBoundsMax: cameraBoundsMax,
            cameraResolution: cameraResolution,
            cameraZoom: cameraZoom,
            world: world,
            screen: screen
        };
    },
    onLoad: function() {
        this.timer = meta.addTimer(this, this.updateStats, 1e3);
        meta.input.onMove.add(this.handleInputMove, this);
        meta.engine.onResize.add(this.handleResize, this);
        meta.world.onResize.add(this.handleWorldResize, this);
        meta.camera.onResize.add(this.handleCameraResize, this);
        meta.camera.onMove.add(this.handleCameraMove, this);
        this.handleInputMove(meta.input, 0);
        this.handleResize(meta.engine);
        this.handleWorldResize(meta.world, 0);
        this.handleCameraResize(meta.camera, 0);
        this.handleCameraMove(meta.camera, 0);
        this.updateStats();
    },
    onUnload: function() {
        meta.input.onMove.remove(this);
        meta.engine.onResize.remove(this);
        meta.world.onResize.remove(this);
        meta.camera.onResize.remove(this);
        meta.camera.onMove.remove(this);
        this.timer.stop();
    },
    updateStats: function() {
        var fps = meta.engine.fps;
        if (fps !== this.fps) {
            this.txt.fps.text = "fps: " + fps;
            this.fps = fps;
        }
        if (window.performance.memory) {
            var memory = (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            if (memory !== this.memory) {
                this.txt.memory.text = "memory: " + memory + "mb";
                this.memory = memory;
            }
        }
        var numEntities = meta.renderer.numEntities;
        if (numEntities !== this.numEntities) {
            this.txt.entities.text = "entities: " + numEntities;
            this.numEntities = numEntities;
        }
    },
    handleInputMove: function(data, event) {
        this.txt.world.text = "world: " + data.x + ", " + data.y;
        this.txt.screen.text = "screen: " + data.screenX + ", " + data.screenY;
    },
    handleCameraMove: function(data, event) {
        var volume = data.volume;
        this.txt.cameraBoundsMin.text = "boundsMin: " + Math.round(volume.minX) + ", " + Math.round(volume.minY);
        this.txt.cameraBoundsMax.text = "boundsMax: " + Math.round(volume.maxX) + ", " + Math.round(volume.maxY);
        this.txt.cameraResolution.text = "width: " + volume.width + ", height: " + volume.height;
    },
    handleCameraResize: function(data, event) {
        this.txt.cameraZoom.text = "zoom: " + data.zoom.toFixed(3);
    },
    handleResize: function(data, event) {
        this.txt.resolution.text = "width: " + data.width + ", height: " + data.height;
    },
    handleWorldResize: function(data, event) {
        var volume = data.volume;
        this.txt.worldBoundsMin.text = "boundsMin: " + Math.round(volume.minX) + ", " + Math.round(volume.minY);
        this.txt.worldBoundsMax.text = "boundsMax: " + Math.round(volume.maxX) + ", " + Math.round(volume.maxY);
        this.txt.worldResolution.text = "width: " + volume.width + ", height: " + volume.height;
    },
    txt: null
});

"use strict";

meta.class("Entity.SVG", "Entity.Geometry", {
    set lineWidth(hex) {
        this._lineWidth = hex;
        this.renderer.needRender = true;
    },
    get lineWidth() {
        return this._lineWidth;
    },
    set strokeStyle(hex) {
        this._strokeStyle = hex;
        this.renderer.needRender = true;
    },
    get strokeStyle() {
        return this._strokeStyle;
    },
    set fillStyle(hex) {
        this._fillStyle = hex;
        this.renderer.needRender = true;
    },
    get fillStyle() {
        return this._fillStyle;
    },
    _lineWidth: 2,
    _strokeStyle: "",
    _fillStyle: ""
});

"use strict";

meta.class("Entity.Line", "Entity.SVG", {
    draw: function(ctx) {
        this.globalAlpha = this._alpha;
        ctx.lineWidth = this._lineWidth;
        ctx.strokeStyle = this._strokeStyle;
        ctx.beginPath();
        ctx.moveTo(this.volume.x, this.volume.y);
        ctx.lineTo(this.toX, this.toY);
        ctx.stroke();
        this.globalAlpha = 1;
    },
    to: function(x, y) {
        if (this.toX === x && this.toY === y) {
            return;
        }
        this.toX = x;
        this.toY = y;
        this.renderer.needRender = true;
    },
    toX: 0,
    toY: 0
});

"use strict";

meta.class("Entity.Rect", "Entity.SVG", {
    draw: function(ctx) {
        ctx.beginPath();
        ctx.rect(this.volume.minX, this.volume.minY, this.volume.width, this.volume.height);
        if (this._fillStyle) {
            ctx.fillStyle = this._fillStyle;
            ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            ctx.lineWidth = this._lineWidth;
            ctx.strokeStyle = this._strokeStyle;
            ctx.stroke();
        }
    }
});

"use strict";

meta.class("Entity.Circle", "Entity.SVG", {
    init: function() {
        this.pivot(.5);
        this.volume.resize(this.radius * 2, this._radius * 2);
    },
    draw: function(ctx) {
        ctx.globalAlpha = this._alpha;
        ctx.beginPath();
        ctx.arc(this.volume.x, this.volume.y, this.radius, 0, Math.PI * 2, false);
        if (this._fillStyle) {
            ctx.fillStyle = this._fillStyle;
            ctx.fill();
        }
        if (this._strokeStyle || !this._fillStyle) {
            ctx.lineWidth = this._lineWidth;
            ctx.strokeStyle = this._strokeStyle;
            ctx.stroke();
        }
    },
    set radius(radius) {
        this._radius = radius;
        this.volume.resize(radius * 2, radius * 2);
        this.updateTotalOffset();
    },
    get radius() {
        return this._radius;
    },
    _radius: 20
});

"use strict";

meta.class("Entity.Gradient", "Entity.Geometry", {
    init: function() {
        this.clear();
    },
    draw: function(ctx) {
        ctx.fillStyle = this._gradient;
        ctx.fillRect(this.volume.minX | 0, this.volume.minY | 0, this.volume.width | 0, this.volume.height | 0);
    },
    clear: function() {
        this._gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
        this._points = [];
    },
    colorStops: function(buffer) {
        var gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
        var num = buffer.length;
        for (var i = 0; i < num; i += 2) {
            gradient.addColorStop(buffer[i], buffer[i + 1]);
        }
        this._gradient = gradient;
        this.renderer.needDraw = true;
    },
    _updateResize: function() {
        this._gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
        this._super();
    },
    set gradient(gradient) {
        if (!gradient) {
            gradient = meta.engine.ctx.createLinearGradient(0, 0, 0, this.volume.height);
        }
        this._gradient = gradient;
        this.renderer.needDraw = true;
    },
    get gradient() {
        return this._gradient;
    },
    Point: function(point, hex) {
        this.point = point;
        this.hex = hex;
    },
    _gradient: null,
    _points: null
});

"use strict";

var Physics = {};
var UI = {};

meta.class("Physics.Manager", {
    init: function() {
        this.bodies = [];
        this.bodiesRemove = [];
        this.manifold = new this.Manifold();
        this.start();
        meta.renderer.onRenderDebug.add(this.renderDebug, this);
    },
    update: function(tDelta) {
        if (this.bodiesRemove.length > 0) {
            this.removeBodies();
        }
        var body1 = null, body2 = null;
        var numBodies = this.bodies.length;
        for (var i = 0; i < numBodies; i++) {
            body1 = this.bodies[i];
            body1.step(tDelta);
            if (body1.worldBounds) {
                this.bodyVsWorld(body1);
            }
        }
        var owner;
        var n = 0;
        for (i = 0; i < numBodies; i++) {
            body1 = this.bodies[i];
            for (n = i + 1; n < numBodies; n++) {
                body2 = this.bodies[n];
                if (body1._mass === 0 && body2._mass === 0) {
                    continue;
                }
                if (this.bodyVsBody(body1, body2)) {
                    body1.colliding = true;
                    body2.colliding = true;
                    if (body1.onCollision) {
                        this.manifold.entity = body2.owner;
                        body1.onCollision(this.manifold);
                    }
                    if (body2.onCollision) {
                        this.manifold.entity = body1.owner;
                        body2.onCollision(this.manifold);
                    }
                }
            }
            owner = body1.owner;
            owner.position(body1.volume.x - owner.totalOffsetX, body1.volume.y - owner.totalOffsetY);
        }
    },
    bodyVsWorld: function(body) {
        var volume;
        var volumes = meta.world.volumes;
        var num = volumes.length;
        for (var n = 0; n < num; n++) {
            volume = volumes[n];
            if (volume === body.volume) {
                continue;
            }
            if (volume.type === 0) {
                this.bodyVsWorldBox(body, volume);
            } else {
                this.bodyVsWorldCircle(body, volume);
            }
        }
    },
    bodyVsWorldBox: function(body, worldVolume) {
        var world = meta.world;
        var volume = body.volume;
        var newX = volume.x;
        var newY = volume.y;
        var colliding = false;
        if (volume.minX < worldVolume.minX) {
            newX = worldVolume.minX + (volume.x - volume.minX);
            this.manifold.normal.x = 1;
            colliding = true;
            if (body.bouncing) {
                body.velocity.x *= -1;
            } else {
                body.velocity.x = 0;
            }
        } else if (volume.maxX > worldVolume.maxX) {
            newX += worldVolume.maxX - volume.maxX;
            this.manifold.normal.x = -1;
            colliding = true;
            if (body.bouncing) {
                body.velocity.x *= -1;
            } else {
                body.velocity.x = 0;
            }
        } else {
            this.manifold.normal.x = 0;
        }
        if (volume.minY < worldVolume.minY) {
            newY = worldVolume.minY + (volume.y - volume.minY);
            this.manifold.normal.y = 1;
            colliding = true;
            if (body.bouncing) {
                body.velocity.y *= -1;
            } else {
                body.velocity.y = 0;
            }
        } else if (volume.maxY > worldVolume.maxY) {
            newY += worldVolume.maxY - volume.maxY;
            this.manifold.normal.y = -1;
            colliding = true;
            if (body.bouncing) {
                body.velocity.y *= -1;
            } else {
                body.velocity.y = 0;
            }
        } else {
            this.manifold.normal.y = 0;
        }
        if (colliding) {
            volume.position(newX, newY);
            if (body.onCollision) {
                this.manifold.entity = null;
                body.onCollision.call(body, this.manifold);
            }
        }
    },
    bodyVsWorldCircle: function(body) {
        var dx = shape.x - volume.x;
        var dy = shape.y - volume.y;
        var r = shape.radius - volume.radius;
        var lengthSquared = dx * dx + dy * dy;
        if (lengthSquared >= r * r) {
            var length = Math.sqrt(lengthSquared);
            if (length !== 0) {
                this.manifold.penetration = r - length;
                this.manifold.normal.x = -dx / length;
                this.manifold.normal.y = -dy / length;
            } else {
                this.manifold.penetration = volume1.radius;
                this.manifold.normal.x = 1;
                this.manifold.normal.y = 0;
            }
            volume.move(this.manifold.penetration * this.manifold.normal.x, this.manifold.penetration * this.manifold.normal.y);
            var value = body.velocity.dot(this.manifold.normal);
            body.velocity.x -= 2 * value * this.manifold.normal.x;
            body.velocity.y -= 2 * value * this.manifold.normal.y;
        }
    },
    boxVsCircle_world: function(body) {},
    circleVsCircle_world: function(body) {},
    bodyVsBody: function(body1, body2) {
        var type1 = body1.volume.type;
        var type2 = body2.volume.type;
        if (type1 === 0) {
            if (type2 === 0) {
                return this.boxVsBox(body1, body2);
            } else if (type2 === 1) {
                return this.boxVsCircle(body1, body2);
            }
        } else if (type1 === 1) {
            if (type2 === 0) {
                return this.boxVsCircle(body2, body1);
            } else if (type2 === 1) {
                return this.circleVsCircle(body1, body2);
            }
        }
        return false;
    },
    boxVsBox: function(body1, body2) {
        var volume1 = body1.volume;
        var volume2 = body2.volume;
        var diffX = volume2.minX + volume2.halfWidth - (volume1.minX + volume1.halfWidth);
        var overlapX = volume1.halfWidth + volume2.halfWidth - Math.abs(diffX);
        if (overlapX <= 0) {
            return false;
        }
        var diffY = volume2.minY + volume2.halfHeight - (volume1.minY + volume1.halfHeight);
        var overlapY = volume1.halfHeight + volume2.halfHeight - Math.abs(diffY);
        if (overlapY <= 0) {
            return false;
        }
        if (overlapX < overlapY) {
            if (diffX < 0) {
                this.manifold.normal.set(-1, 0);
            } else {
                this.manifold.normal.set(1, 0);
            }
            this.manifold.penetration = overlapX;
        } else {
            if (diffY < 0) {
                this.manifold.normal.set(0, -1);
            } else {
                this.manifold.normal.set(0, 1);
            }
            this.manifold.penetration = overlapY;
        }
        if (body2._mass === 0) {
            volume1.move(-this.manifold.penetration * this.manifold.normal.x, -this.manifold.penetration * this.manifold.normal.y);
        }
        if (body1._mass === 0) {
            volume2.move(this.manifold.penetration * this.manifold.normal.x, this.manifold.penetration * this.manifold.normal.y);
        }
        return true;
    },
    circleVsCircle: function(body1, body2) {
        var volume1 = body1.volume;
        var volume2 = body2.volume;
        var dx = volume2.x - volume1.x;
        var dy = volume2.y - volume1.y;
        var r = volume1.radius + volume2.radius;
        var lengthSquared = dx * dx + dy * dy;
        if (lengthSquared > r * r) {
            return false;
        }
        var length = Math.sqrt(lengthSquared);
        if (length !== 0) {
            this.manifold.penetration = r - length;
            this.manifold.normal.x = -dx / length;
            this.manifold.normal.y = -dy / length;
        } else {
            this.manifold.penetration = volume1.radius;
            this.manifold.normal.x = 1;
            this.manifold.normal.y = 0;
        }
        var massUnit = 1 / (body1._mass + body2._mass);
        var penetration = this.manifold.penetration * (body1._mass * massUnit);
        volume1.move(penetration * this.manifold.normal.x, penetration * this.manifold.normal.y);
        body1.velocity.reflect(this.manifold.normal);
        this.manifold.normal.x = -this.manifold.normal.x;
        this.manifold.normal.y = -this.manifold.normal.y;
        penetration = this.manifold.penetration * (body2._mass * massUnit);
        volume2.move(penetration * this.manifold.normal.x, penetration * this.manifold.normal.y);
        body2.velocity.reflect(this.manifold.normal);
        return true;
    },
    boxVsCircle: function(body1, body2) {
        var volume1 = body1.volume;
        var volume2 = body2.volume;
        var diffX = volume2.x - (volume1.minX + volume1.halfWidth);
        var diffY = volume2.y - (volume1.minY + volume1.halfHeight);
        var extentX = (volume1.maxX - volume1.minX) * .5;
        var extentY = (volume1.maxY - volume1.minY) * .5;
        var closestX = Math.min(Math.max(diffX, -extentX), extentX);
        var closestY = Math.min(Math.max(diffY, -extentY), extentY);
        if (diffX === closestX && diffY === closestY) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                this.manifold.normal.y = 0;
                if (diffX < 0) {
                    this.manifold.normal.x = -1;
                    this.manifold.penetration = volume1.halfWidth + diffX + volume2.radius;
                } else {
                    this.manifold.normal.x = 1;
                    this.manifold.penetration = volume1.halfWidth - diffX + volume2.radius;
                }
            } else {
                this.manifold.normal.x = 0;
                if (diffY < 0) {
                    this.manifold.normal.y = -1;
                    this.manifold.penetration = volume1.halfHeight + diffY + volume2.radius;
                } else {
                    this.manifold.normal.y = 1;
                    this.manifold.penetration = volume1.halfHeight - diffY + volume2.radius;
                }
            }
        } else {
            var normalX = diffX - closestX;
            var normalY = diffY - closestY;
            var length = normalX * normalX + normalY * normalY;
            if (length > volume2.radius * volume2.radius) {
                return false;
            }
            this.manifold.penetration = Math.sqrt(length) - volume2.radius;
            this.manifold.normal.x = -normalX;
            this.manifold.normal.y = -normalY;
            this.manifold.normal.normalize();
        }
        var massUnit = 1 / (body1._mass + body2._mass);
        var penetration = this.manifold.penetration * (body1._mass * massUnit);
        volume1.move(penetration * -this.manifold.normal.x, penetration * -this.manifold.normal.y);
        penetration = this.manifold.penetration * (body2._mass * massUnit);
        volume2.move(penetration * this.manifold.normal.x, penetration * this.manifold.normal.y);
        if (body1.bouncing) {
            body1.velocity.reflect(this.manifold.normal);
        }
        if (body2.bouncing) {
            body2.velocity.reflect(this.manifold.normal);
        }
        return true;
    },
    renderDebug: function(renderer) {
        if (this.bodies.length === 0) {
            return;
        }
        var ctx = renderer.ctx;
        ctx.save();
        ctx.fillStyle = this.debugColor;
        ctx.globalAlpha = .8;
        var body;
        var entities = renderer.entities;
        var num = entities.length;
        for (var n = 0; n < num; n++) {
            body = entities[n].components.Body;
            if (!body) {
                continue;
            }
            this.drawVolume(ctx, body.volume);
        }
        ctx.restore();
    },
    drawVolume: function(ctx, volume) {
        if (volume.type === 0) {
            ctx.fillRect(Math.floor(volume.minX), Math.floor(volume.minY), Math.ceil(volume.width), Math.ceil(volume.height));
        } else if (volume.type === 1) {
            ctx.beginPath();
            ctx.arc(Math.floor(volume.x), Math.floor(volume.y), volume.radius, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    },
    add: function(body) {
        if (!body) {
            console.warn("(Physics) Invalid body passed");
            return;
        }
        if (body.__index !== -1) {
            console.warn("(Physics) Body is already in use");
            return;
        }
        body.__index = this.bodies.length;
        this.bodies.push(body);
    },
    remove: function(body) {
        if (!body) {
            console.warn("(Physics) Invalid body passed");
            return;
        }
        if (body.__index === -1) {
            console.warn("(Physics) Body is not in use");
            return;
        }
        this.bodiesRemove.push(body);
    },
    removeBodies: function() {
        var body, tmpBody;
        var num = this.bodiesRemove.length;
        for (var n = 0; n < num; n++) {
            body = this.bodiesRemove[n];
            tmpBody = this.bodies[num - 1];
            tmpBody.__index = body.__index;
            body.__index = -1;
            this.bodies[body.__index] = tmpBody;
            num--;
        }
        this.bodies.length = num;
        this.bodiesRemove.length = 0;
        console.log(num);
    },
    start: function() {
        meta.engine.onUpdate.add(this.update, this);
    },
    stop: function() {
        meta.engine.onUpdate.remove(this);
    },
    Manifold: function() {
        this.entity = null;
        this.normal = new meta.math.Vector2(0, 0);
        this.penetration = 0;
    },
    bodies: null,
    bodiesRemove: null,
    gravity: new meta.math.Vector2(0, 0),
    wind: new meta.math.Vector2(0, 0),
    friction: 25,
    manifold: null,
    _relativeVel: new meta.math.Vector2(0, 0),
    _impulseX: 0,
    _impulseY: 0,
    _percent: .8,
    _slop: .01,
    debugColor: "#00ff00"
});

"use strict";

meta.component("Physics.Body", {
    onAdd: function() {
        this.velocity = new meta.math.Vector2(0, 0);
        this.acceleration = new meta.math.Vector2(0, 0);
        this.speed = new meta.math.Vector2(0, 0);
        this._volume = this.owner.volume;
    },
    onActiveEnter: function() {
        meta.physics.add(this);
    },
    onActiveExit: function() {
        meta.physics.remove(this);
    },
    step: function(tDelta) {
        this.colliding = false;
        this.volume.position(this.owner.volume.x, this.owner.volume.y);
        if (this.haveTarget) {
            var distance = meta.math.length(this.volume.x, this.volume.y, this.targetX, this.targetY);
            if (distance <= this.speed * tDelta) {
                this.volume.position(this.targetX, this.targetY);
                this.stop();
            } else {
                this._vec.x = this.targetX - this.volume.x;
                this._vec.y = this.targetY - this.volume.y;
                this._vec.normalize();
                this.velocity.x = this._vec.x * this.speed;
                this.velocity.y = this._vec.y * this.speed;
            }
        }
        this.velocity.x += this.acceleration.x * tDelta;
        this.velocity.y += this.acceleration.y * tDelta;
        this.volume.move(this.velocity.x * tDelta, this.velocity.y * tDelta);
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    },
    applyForce: function(vec) {
        this.acceleration.x += vec.x / this.invMass;
        this.acceleration.y += vec.y / this.invMass;
    },
    moveTo: function(x, y, speed, moveToCB) {
        this.targetX = x;
        this.targetY = y;
        this.haveTarget = true;
        this.speed = speed || 600;
        this.moveToCB = moveToCB || null;
    },
    stop: function() {
        this.speed = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (this.haveTarget) {
            this.haveTarget = false;
            if (this.moveToCB) {
                this.moveToCB.call(this.owner);
                this.moveToCB = null;
            }
        }
        if (this.onStop) {
            this.onStop.call(this.owner);
        }
    },
    onStop: null,
    set volume(volume) {
        if (volume instanceof meta.math.Circle) {
            this.type = 1;
        } else {
            this.type = 0;
        }
        this._volume = volume;
        this._volume.position(this.owner.volume.x, this.owner.volume.y);
    },
    get volume() {
        return this._volume;
    },
    set mass(value) {
        this._mass = value;
        if (value === 0) {
            this.invMass = 0;
        } else {
            this.invMass = 1 / value;
        }
    },
    get mass() {
        return this._mass;
    },
    type: 0,
    _volume: null,
    _mass: 1,
    invMass: 1,
    restitution: .6,
    velocity: null,
    moveX: 0,
    moveY: 0,
    worldBounds: false,
    ghost: false,
    bouncing: false,
    colliding: false,
    targetX: 0,
    targetY: 0,
    haveTarget: false,
    moveToCB: null,
    maxSpeed: Number.MAX_VALUE,
    acceleration: null,
    accelerationMod: 1,
    _vec: new meta.math.Vector2(0, 0),
    __index: -1
});

"use strict";

meta.class("UI.Controller", "meta.Controller", {
    onFirstReady: function() {
        var buttonTex = new Resource.Texture();
        buttonTex.fillRect({
            color: "#111",
            width: 120,
            height: 30
        });
        var buttonOnHoverTex = new Resource.Texture();
        buttonOnHoverTex.fillRect({
            color: "#ff0000",
            width: 120,
            height: 30
        });
        this.coreStyle = {
            button: {
                "*:hover": {
                    cursor: "pointer"
                },
                "*:pressed, *:drag": {
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            },
            checkbox: {
                "*:hover": {
                    cursor: "pointer"
                },
                "*:pressed, *:drag": {
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            }
        };
        this.style = {
            button: {
                "*": {
                    texture: buttonTex
                },
                "*:hover": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer"
                },
                "*:pressed": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            },
            checkbox: {
                "*": {
                    texture: buttonTex
                },
                "*:hover": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer"
                },
                "*:pressed": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                },
                "[off]": {
                    texture: buttonTex
                },
                "[on]": {
                    texture: buttonOnHoverTex
                }
            }
        };
    },
    coreStyle: null,
    style: null
});

"use strict";

meta.class("UI.Button", "Entity.Geometry", {
    onCreate: function() {
        this.picking = true;
    },
    onHoverEnter: function(data) {
        meta.engine.cursor = "pointer";
    },
    onHoverExit: function(data) {
        meta.engine.cursor = "auto";
    },
    onDown: function() {
        this.move(this.pressOffset, this.pressOffset);
    },
    onUp: function() {
        this.move(-this.pressOffset, -this.pressOffset);
    },
    _createLabel: function(text) {
        if (!text) {
            text = "";
        }
        this._label = new Entity.Text(text);
        this._label.pivot(.5);
        this._label.anchor(.5);
        this._label.pickable = false;
        this._label.size = 12;
        this._label.color = "#ffffff";
        this.attach(this._label);
    },
    set text(str) {
        if (!this._label) {
            this._createLabel(str);
        } else {
            this._label.text = str;
        }
    },
    get text() {
        if (!this._label) {
            return "";
        }
        return this._label.text;
    },
    get label() {
        if (!this._label) {
            this._createLabel();
        }
        return this._label;
    },
    _label: null,
    pressOffset: 2
});

"use strict";

meta.class("UI.Checkbox", "Entity.Geometry", {
    _initParams: function(params) {
        if (params) {
            this.style = meta.createStyle(params, UI.ctrl.coreStyle.checkbox);
        } else {
            this.style = UI.ctrl.style.checkbox;
        }
        var self = this;
        var entity = new Entity.Geometry();
        entity.style = this._style.childStyle;
        entity.anchor(.5);
        entity.pickable = false;
        entity.onChange = function() {
            self._onChildChange(this);
        };
        this.attach(entity);
        this.state = "off";
        this._onClick = this.toggle;
    },
    toggle: function() {
        var child = this.children[0];
        if (this.group) {
            child.state = "on";
        } else {
            if (child.state === "on") {
                child.state = "off";
            } else {
                child.state = "on";
            }
        }
    },
    _onChange: function() {
        this.children[0].state = this._state;
        if (this.group && this._state === "on") {
            this.group._onStateChange(this);
        }
    },
    _onChildChange: function(child) {
        this.state = this.children[0]._state;
    },
    set checked(value) {
        this.state = value ? "on" : "off";
    },
    get checked() {
        return this._state === "on";
    },
    set text(str) {
        if (!this._text) {
            this._text = new Entity.Text(str);
            this._text.size = 12;
            this._text.color = "#ffffff";
            this.attach(this._text);
            this._text.anchor(.5);
            this._text.pickable = false;
        } else {
            this._text.setText(str);
        }
    },
    get text() {
        if (!this._text) {
            return "";
        }
        return this._text._text;
    },
    _text: null,
    group: null,
    value: ""
});

"use strict";

meta.class("UI.ProgressBar", "Entity.Geometry", {
    init: function(texture, fillTexture) {
        this._super(texture);
        var fill = new Entity.Geometry(fillTexture);
        this.attach(fill);
        this.updateUnits();
    },
    updateProgress: function() {
        var units = Math.floor(this._fillWidth / 100 * this._value);
        var fill = this.children[0];
        fill.width = units;
    },
    updateUnits: function() {
        var texture = this.children[0]._texture;
        if (texture._loaded) {
            this._fillWidth = texture.fullWidth;
        }
    },
    set min(value) {
        if (this._min === value) {
            return;
        }
        this._min = value;
        this.updateProgress();
    },
    set max(value) {
        if (this._max === value) {
            return;
        }
        this._max = value;
        this.updateProgress();
    },
    set value(value) {
        if (value < this._min) {
            value = this._min;
        } else if (value > this._max) {
            value = this._max;
        }
        if (this._value === value) {
            return;
        }
        this._value = value;
        this.updateProgress();
    },
    set percents(percents) {
        var range = this._max - this._min;
        var value = range / 100 * percents;
    },
    get min() {
        return this._min;
    },
    get max() {
        return this._max;
    },
    get value() {
        return this._value;
    },
    get percents() {
        return this._percents;
    },
    set fillTexture(fillTexture) {
        this.children[0].texture = fillTexture;
        this.updateProgress();
    },
    get fillTexture() {
        return this.children[0]._texture;
    },
    _min: 0,
    _max: 100,
    _value: 100,
    _unit: 1,
    _fillWidth: 1
});

"use strict";

meta.class("UI.Group", "Entity.Geometry", {
    add: function(entity) {
        if (entity.group) {
            entity.detach();
        }
        if (!this.children) {
            entity.state = "on";
            this._value = entity.value;
        }
        this.attach(entity);
        entity.group = this;
    },
    _onStateChange: function(entity) {
        this.prevValue = this._value;
        this._value = entity.value;
        var child;
        var numChildren = this.children.length;
        for (var i = 0; i < numChildren; i++) {
            child = this.children[i];
            if (child === entity) {
                continue;
            }
            this.children[i].state = "off";
        }
        this.onChange(this);
    },
    set value(_value) {
        if (this.children) {
            var numChildren = this.children.length;
            for (var n = 0; n < numChildren; n++) {
                if (this.children[n].value === _value) {
                    this.children[n].state = "on";
                    break;
                }
            }
        }
    },
    get value() {
        return this._value;
    },
    prevValue: "",
    _value: ""
});

"use strict";

meta.Tween = function() {
    this.cache = null;
    this.chain = [];
};

meta.Tween.prototype = {
    play: function() {
        if (!this.cache) {
            this.autoPlay = true;
        } else {
            var cache = this.cache;
            if (!cache.owner) {
                return this;
            }
            if (cache.owner.removed) {
                return this;
            }
            cache.paused = false;
            cache.numRepeat = this.numRepeat;
            this.next();
            this._play();
        }
        return this;
    },
    _play: function() {
        if (this.cache.__index !== -1) {
            return;
        }
        this.cache.__index = meta.renderer.tweens.push(this.cache) - 1;
        if (this._group) {
            this._group.activeUsers++;
        }
    },
    stop: function(callCB) {
        if (this.cache.__index === -1) {
            return;
        }
        this.cache.link = null;
        this.cache.index = 0;
        meta.renderer.tweensRemove.push(this.cache);
        this.cache.__index = -1;
        if (callCB) {
            callCB(this.cache.owner);
        }
        if (this._group) {
            this._group.activeUsers--;
            if (this._group.activeUsers === 0 && this._group.callback) {
                this._group.callback();
            }
        }
        return this;
    },
    paused: function(value) {
        if (value === void 0) {
            value = true;
        }
        this.cache.paused = value;
        return this;
    },
    resume: function() {
        this.cache.paused = false;
        return this;
    },
    clear: function() {
        this.stop(null);
        this.chain.length = 0;
        if (this._group) {
            this._group.users--;
            this._group = null;
        }
        return this;
    },
    reset: function() {
        var cache = this.cache;
        cache.index = 0;
        cache.link = this.chain[0];
        if (!cache.link) {
            return this;
        }
        for (var key in cache.link.startValues) {
            cache.owner[key] = cache.link.startValues[key];
        }
        this.stop(false);
        return this;
    },
    next: function() {
        var repeating = false;
        var cache = this.cache;
        if (cache.index === this.chain.length) {
            if (cache.numRepeat === 0) {
                this.stop();
                if (this.onDone) {
                    this.onDone.call(this.cache);
                }
                return this;
            } else {
                cache.index = 0;
                if (cache.numRepeat !== -1) {
                    cache.numRepeat--;
                    if (cache.numRepeat === 0) {
                        this.stop();
                        if (this.onDone) {
                            this.onDone.call(this.cache);
                        }
                        return this;
                    }
                }
                repeating = true;
            }
        }
        cache._done = false;
        var key;
        var link = this.chain[cache.index++];
        var owner = cache.owner;
        if (!repeating) {
            for (key in link.endValues) {
                link.startValues[key] = owner[key];
            }
        } else {
            for (key in link.startValues) {
                owner[key] = link.startValues[key];
            }
        }
        if (link._onStart) {
            link._onStart.call(this);
        }
        cache._tStart = meta.time.current;
        cache._tFrame = 0;
        cache.link = link;
        return this;
    },
    repeat: function(numRepeat) {
        if (numRepeat === void 0) {
            numRepeat = -1;
        }
        this.numRepeat = numRepeat;
        return this;
    },
    set reverse(value) {
        if (value === void 0) {
            value = true;
        }
        this.cache.reverse = value;
        return this;
    },
    get reverse() {
        return this.cache.reverse;
    },
    update: function(tDelta) {
        var cache = this.cache;
        if (!cache.link) {
            this.stop(false);
            return;
        }
        cache._tFrame += meta.time.delta;
        var link = cache.link;
        var tElapsed = (meta.time.current - cache._tStart) / link.duration;
        if (tElapsed > 1) {
            tElapsed = 1;
        }
        if (cache._done) {
            if (cache.tFrameDelay < link.tDelay) {
                return;
            }
        } else {
            if (link.endValues) {
                link.update(tElapsed);
                if (link._onTick) {
                    link._onTick.call(this.cache);
                }
            }
        }
        if (tElapsed === 1) {
            if (!cache._done) {
                cache._done = true;
                return;
            }
            if (link._onDone) {
                link._onDone.call(this.cache);
            }
            this.next();
        }
    },
    to: function(endValues, duration, onDone) {
        var link = new meta.Tween.Link(this, endValues, duration, onDone);
        this.chain.push(link);
        return link;
    },
    wait: function(duration, onDone) {
        var link = new meta.Tween.Link(this, null, duration, onDone);
        this.chain.push(link);
        return link;
    },
    group: function(group) {
        if (!group) {
            console.warn("(meta.Tween.group) No group name specified.");
            return this;
        }
        if (this._group) {
            console.warn("(meta.Tween.group) Tween already is part of a group.");
            return this;
        }
        if (typeof group === "object") {
            this._group = group;
        }
        this._group.users++;
        return this;
    },
    autoPlay: false,
    _group: null,
    _removeFlag: 0,
    numRepeat: 0
};

meta.Tween.Cache = function(owner) {
    this.owner = owner;
    this.tween = null;
    this.link = null;
    this.index = 0;
    this.numRepeat = 0;
    this._tStart = 0;
    this._tFrame = 0;
    this.onDone = null;
    this._done = false;
    this.__index = -1;
};

meta.Tween.Cache.prototype = {
    update: function(tDelta) {
        this.tween.cache = this;
        this.tween.update(tDelta);
        this.tween.cache = null;
    },
    stop: function() {
        this.tween.cache = this;
        this.tween.stop();
        this.tween.cache = null;
    },
    paused: false,
    reverse: false,
    _flags: 0
};

meta.Tween.Group = function(name, callback) {
    if (typeof name === "function") {
        callback = name;
        name = "";
    }
    this.name = name;
    this.users = 0;
    this.activeUsers = 0;
    this.callback = callback || null;
};

"use strict";

meta.Tween.Easing = {
    linear: function(k) {
        return k;
    },
    quadIn: function(k) {
        return k * k;
    },
    quadOut: function(k) {
        return k * (2 - k);
    },
    quadInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k;
        }
        return -.5 * (--k * (k - 2) - 1);
    },
    cubicIn: function(k) {
        return k * k * k;
    },
    cubicOut: function(k) {
        return --k * k * k + 1;
    },
    cubicInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k;
        }
        return .5 * ((k -= 2) * k * k + 2);
    },
    quartIn: function(k) {
        return k * k * k * k;
    },
    quartOut: function(k) {
        return 1 - --k * k * k * k;
    },
    quartInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k * k;
        }
        return -.5 * ((k -= 2) * k * k * k - 2);
    },
    quintIn: function(k) {
        return k * k * k * k * k;
    },
    quintOut: function(k) {
        return --k * k * k * k * k + 1;
    },
    quintIntOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k * k * k;
        }
        return .5 * ((k -= 2) * k * k * k * k + 2);
    },
    sineIn: function(k) {
        return 1 - Math.cos(k * Math.PI / 2);
    },
    sineOut: function(k) {
        return Math.sin(k * Math.PI / 2);
    },
    sineIntOut: function(k) {
        return .5 * (1 - Math.cos(Math.PI * k));
    },
    expoIn: function(k) {
        if (k === 0) {
            return 0;
        }
        return Math.pow(1024, k - 1);
    },
    expoOut: function(k) {
        if (k === 1) {
            return 1;
        }
        return 1 - Math.pow(2, -10 * k);
    },
    expoInOut: function(k) {
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if ((k *= 2) < 1) {
            return .5 * Math.pow(1024, k - 1);
        }
        return .5 * (-Math.pow(2, -10 * (k - 1)) + 2);
    },
    circIn: function(k) {
        return 1 - Math.sqrt(1 - k * k);
    },
    circOut: function(k) {
        return Math.sqrt(1 - --k * k);
    },
    circInOut: function(k) {
        if ((k *= 2) < 1) {
            return -.5 * (Math.sqrt(1 - k * k) - 1);
        }
        return .5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
    },
    elasticIn: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    },
    elasticOut: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1;
    },
    elasticInOut: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        if ((k *= 2) < 1) {
            return -.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        }
        return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * .5 + 1;
    },
    backIn: function(k) {
        var s = 1.70158;
        return k * k * ((s + 1) * k - s);
    },
    backOut: function(k) {
        var s = 1.70158;
        return --k * k * ((s + 1) * k + s) + 1;
    },
    backInOut: function(k) {
        var s = 1.70158 * 1.525;
        if ((k *= 2) < 1) {
            return .5 * (k * k * ((s + 1) * k - s));
        }
        return .5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    },
    bounceIn: function(k) {
        return 1 - meta.Tween.Easing.bounceOut(1 - k);
    },
    bounceOut: function(k) {
        if (k < 1 / 2.75) {
            return 7.5625 * k * k;
        } else if (k < 2 / 2.75) {
            return 7.5625 * (k -= 1.5 / 2.75) * k + .75;
        } else if (k < 2.5 / 2.75) {
            return 7.5625 * (k -= 2.25 / 2.75) * k + .9375;
        }
        return 7.5625 * (k -= 2.625 / 2.75) * k + .984375;
    },
    bounceInOut: function(k) {
        if (k < .5) {
            return meta.Tween.Easing.bounceIn(k * 2) * .5;
        }
        return meta.Tween.Easing.bounceOut(k * 2 - 1) * .5 + .5;
    }
};

"use strict";

meta.Tween.Link = function Link(tween, endValues, duration, onDone) {
    this.tween = tween;
    this.startValues = {};
    this.endValues = endValues;
    this.duration = duration;
    this._onDone = onDone || null;
};

meta.Tween.Link.prototype = {
    play: function() {
        this.tween.play();
        return this;
    },
    stop: function() {
        this.tween.stop();
        return this;
    },
    paused: function(value) {
        this.tween.paused(value);
        return this;
    },
    resume: function() {
        this.tween.resume();
        return this;
    },
    clear: function() {
        this.tween.clear();
        return this;
    },
    reset: function() {
        this.tween.reset();
        return this;
    },
    update: function(tElapsed) {
        var value = this._easing(tElapsed);
        var startValue, endValue, result;
        var owner = this.tween.cache.owner;
        for (var key in this.endValues) {
            startValue = this.startValues[key];
            endValue = this.endValues[key];
            if (typeof startValue === "string") {
                endValue = startValue + parseFloat(endValue, 4);
            }
            result = startValue + (endValue - startValue) * value;
            if (this.rounding) {
                result = Math.round(result);
            }
            owner[key] = result;
        }
    },
    next: function() {
        this.tween.next();
        return this;
    },
    wait: function(duration, onDone) {
        return this.tween.wait(duration, onDone);
    },
    frameDelay: function(tFrameDelay) {
        this.tFrameDelay = tFrameDelay;
        return this;
    },
    round: function(value) {
        if (value === void 0) {
            value = true;
        }
        this.isRounding = value;
        return this;
    },
    repeat: function(numRepeat) {
        this.tween.repeat(numRepeat);
        return this;
    },
    reverse: function(value) {
        this.tween.reverse(value);
        return this;
    },
    easing: function(func) {
        if (typeof func === "function") {
            this._easing = func;
        } else {
            this._easing = meta.Tween.Easing[func];
        }
        if (this._easing === void 0) {
            this._easing = meta.Tween.Easing.linear;
        }
        return this;
    },
    onStart: function(func) {
        this._onStart = func;
        return this;
    },
    onDone: function(func) {
        this.tween.onDone = func;
        return this;
    },
    onTick: function(func) {
        this._onTick = func;
        return this;
    },
    to: function(endValues, duration, onDone) {
        return this.tween.to(endValues, duration, onDone);
    },
    group: function(name) {
        return this.tween.group(name);
    },
    _easing: meta.Tween.Easing.linear,
    _onStart: null,
    _onDone: null,
    _onTick: null,
    tFrameDelay: 0,
    rounding: false
};

"use strict";

meta.controller("meta.Loading", {
    onInit: function() {
        meta.preloading = this;
        meta.loading = this;
    },
    onFirstLoad: function() {
        this.view.z = Number.MAX_SAFE_INTEGER - 10;
        this.view.static = true;
        var bgTexture = new Resource.SVG();
        bgTexture.fillStyle = "#030303";
        bgTexture.fillRect(0, 0, 1, 1);
        this.bg = new Entity.Geometry(bgTexture);
        this.bg.fitIn(meta.camera.width, meta.camera.height);
        this.view.attach(this.bg);
        var progressShadowTexture = new Resource.SVG();
        progressShadowTexture.fillStyle = "#222";
        progressShadowTexture.fillRect(0, 0, 100, 4);
        var progressShadow = new Entity.Geometry(progressShadowTexture);
        progressShadow.pivot(.5);
        progressShadow.anchor(.5);
        this.view.attach(progressShadow);
        var progressTexture = new Resource.SVG();
        progressTexture.fillStyle = "white";
        progressTexture.fillRect(0, 0, 100, 4);
        this.progress = new Entity.Geometry(progressTexture);
        this.progress.clipBounds(0, 4);
        this.progress.pivot(.5);
        this.progress.anchor(.5);
        this.view.attach(this.progress);
    },
    onLoad: function() {
        meta.camera.onResize.add(this.onResize, this);
        meta.resources.onLoadingUpdate.add(this.onResourceLoaded, this);
    },
    onUnload: function() {
        meta.camera.onResize.remove(this);
        meta.resources.onLoadingUpdate.remove(this);
    },
    onResize: function(data) {
        this.bg.fitIn(data.width, data.height);
    },
    onResourceLoaded: function(mgr) {
        var percents = Math.min(100 / mgr.numTotalToLoad * (mgr.numTotalToLoad - mgr.numToLoad), 100);
        this.progress.clipBounds(percents, 4);
    },
    bg: null,
    progress: null
});

"use strict";

meta.createEngine = function() {
    meta.onDomLoad(function() {
        meta.classLoaded();
        if (!meta.engine.autoInit) {
            return;
        }
        meta.engine.create();
    });
};

meta.createEngine();

meta.loadScript = function(src, onLoad) {
    if (!meta.engine || !meta.engine.isLoaded) {
        if (!meta.cache.scripts) {
            meta.cache.scripts = [];
        }
        meta.cache.scripts.push({
            s: src,
            c: onLoad
        });
    } else {
        meta._loadScript({
            s: src,
            c: onLoad
        });
    }
};

meta._loadScript = function(obj) {
    var script = document.createElement("script");
    var firstScript = document.scripts[0];
    if ("async" in firstScript) {
        script.async = false;
        script.onload = obj.c;
        script.src = obj.s;
        document.head.appendChild(script);
    } else if (firstScript.readyState) {
        if (!meta.cache.pendingScripts) {
            meta.cache.pendingScripts = [];
        }
        meta.cache.pendingScripts.push(script);
        script.onreadystatechange = meta._onReadyStateChange;
        script.src = obj.s;
    } else {
        document.write("<script src='" + src + "' defer></script>");
    }
};

meta._onReadyStateChange = function() {
    var pendingScript;
    var pendingScripts = meta.cache.pendingScripts;
    while (pendingScripts[0] && pendingScripts[0].s.readyState === "loaded") {
        pendingScript = pendingScripts.shift();
        pendingScript.s.onreadystatechange = null;
        document.scripts[0].parentNode.insertBefore(pendingScript.s, firstScript);
        if (pendingScript.c) {
            pendingScript.c();
        }
    }
};

meta._loadAllScripts = function() {
    var scripts = meta.cache.scripts;
    if (!scripts) {
        return false;
    }
    var numScripts = scripts.length;
    if (numScripts === 0) {
        return false;
    }
    var callback = function() {
        var cache = meta.cache;
        cache.numScriptsToLoad--;
        var scripts = meta.cache.scripts;
        var numScripts = scripts.length;
        if (numScripts > 0) {
            cache.numScriptsToLoad += numScripts;
            cache.scripts = [];
            var script;
            for (var n = 0; n < numScripts; n++) {
                script = scripts[n];
                script.c = callback;
                meta._loadScript(script);
            }
        }
        if (cache.numScriptsToLoad === 0) {
            cache.scripts = null;
            meta.engine.onScriptLoadingEnd();
        }
    };
    var script;
    var cache = meta.cache;
    cache.numScriptsToLoad += scripts.length;
    cache.scripts = [];
    for (var i = 0; i < numScripts; i++) {
        script = scripts[i];
        script.c = callback;
        meta._loadScript(script);
    }
    return true;
};

meta.import = function(path) {
    if (!path) {
        return;
    }
    var buffer = path.split("/");
    var name = buffer[0];
    if (!meta.isUrl(path)) {
        path = meta.importUrl + path + "/" + path + ".js";
    }
    meta.loadScript(path, null);
};