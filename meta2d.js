// var x = 10;
// x = 20;
// var y = "sdsd";
// y = {
// 	a: 20
// }
// var z = false;

function x(a, b) {
	return a + b;
}

var a = x(20, 30);

function Entity()
{
	this.b = 20;
	this.c = this.b;
}

Entity.prototype = {
	a: 10
}

var x1 = 10;
var y2 = "sdsd";

// var x = {};
// x.a = 10;

// var meta = {};
// meta.x = {};

// meta.x.Device = function() {
    // this.name = "unknown";
    // this.version = "0";
    // this.versionBuffer = null;
//     this.vendors = [ "", "webkit", "moz", "ms", "o" ];
//     this.vendor = "";
//     this.support = {};
//     // this.isPortrait = false;
//     // this.audioAPI = false;
//     // this.hidden = null;
//     // this.visibilityChange = null;
//     // this.fullScreenRequest = null;
//     // this.fullScreenExit = null;
//     // this.fullScreenOnChange = null;
//     // this.fullscreen = false;
//     //this.load();
// }

// meta.x.Device.prototype.audioFormats = [];
// meta.x.Device.prototype.mobile = false;

// var x = 10;
// x = 20;

var meta = {
	
};

meta.x = {};

meta.Device2 = function() {}

meta.Device2.prototype = {};

meta.Device2.prototype.y = meta;

// meta.x = {};
meta.x.Device = function() {};
meta.x.Device.prototype = {};
// meta.Device2 = function() {
// 	this.name = "unknown";
//     this.version = "0";
//     this.a = this.version;
//     this.versionBuffer = null;
// };
// meta.Device2.prototype = {

// };

// meta.x.Device.prototype.x = 10;

// meta.x.Device.prototype = {};

// meta.Device.prototype = {
//     load: function() {
//         this.checkBrowser();
//         this.mobile = this.isMobileAgent();
//         this.checkConsoleCSS();
//         this.checkFileAPI();
//         this.support.onloadedmetadata = typeof window.onloadedmetadata === "object";
//         this.support.onkeyup = typeof window.onkeyup === "object";
//         this.support.onkeydown = typeof window.onkeydown === "object";
//         this.support.canvas = this.isCanvasSupport();
//         this.support.webgl = this.isWebGLSupport();
//         this.modernize();
//     },
//     checkBrowser: function() {
//         var regexps = {
//             Chrome: [ /Chrome\/(\S+)/ ],
//             Firefox: [ /Firefox\/(\S+)/ ],
//             MSIE: [ /MSIE (\S+);/ ],
//             Opera: [ /OPR\/(\S+)/, /Opera\/.*?Version\/(\S+)/, /Opera\/(\S+)/ ],
//             Safari: [ /Version\/(\S+).*?Safari\// ]
//         };
//         var userAgent = navigator.userAgent;
//         var name, currRegexp, match;
//         var numElements = 2;
//         for (name in regexps) {
//             while (currRegexp = regexps[name].shift()) {
//                 if (match = userAgent.match(currRegexp)) {
//                     this.version = match[1].match(new RegExp("[^.]+(?:.[^.]+){0," + --numElements + "}"))[0];
//                     this.name = name;
//                     this.versionBuffer = this.version.split(".");
//                     var versionBufferLength = this.versionBuffer.length;
//                     for (var i = 0; i < versionBufferLength; i++) {
//                         this.versionBuffer[i] = parseInt(this.versionBuffer[i]);
//                     }
//                     break;
//                 }
//             }
//         }
//         if (this.versionBuffer === null || this.name === "unknown") {
//             console.warn("(meta.Device.checkBrowser) Could not detect browser.");
//         } else {
//             if (this.name === "Chrome" || this.name === "Safari" || this.name === "Opera") {
//                 this.vendor = "webkit";
//             } else if (this.name === "Firefox") {
//                 this.vendor = "moz";
//             } else if (this.name === "MSIE") {
//                 this.vendor = "ms";
//             }
//         }
//     },
//     checkConsoleCSS: function() {
//         if (!this.mobile && (this.name === "Chrome" || this.name === "Opera")) {
//             this.support.consoleCSS = true;
//         } else {
//             this.support.consoleCSS = false;
//         }
//     },
//     checkFileAPI: function() {
//         if (window.File && window.FileReader && window.FileList && window.Blob) {
//             this.support.fileAPI = true;
//         } else {
//             this.support.fileAPI = false;
//         }
//     },
//     modernize: function() {
//         if (!Number.MAX_SAFE_INTEGER) {
//             Number.MAX_SAFE_INTEGER = 9007199254740991;
//         }
//         this.supportConsole();
//         this.supportPageVisibility();
//         this.supportFullScreen();
//         this.supportRequestAnimFrame();
//         this.supportPerformanceNow();
//         this.supportAudioFormats();
//         this.supportAudioAPI();
//         this.supportFileSystemAPI();
//     },
//     isMobileAgent: function() {
//         return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
//     },
//     isCanvasSupport: function() {
//         return !!window.CanvasRenderingContext2D;
//     },
//     isWebGLSupport: function() {
//         var canvas = document.createElement("canvas");
//         var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//         return !!context;
//     },
//     supportConsole: function() {
//         if (!window.console) {
//             window.console = {};
//             window.console.log = meta.emptyFuncParam;
//             window.console.warn = meta.emptyFuncParam;
//             window.console.error = meta.emptyFuncParam;
//         }
//     },
//     supportPageVisibility: function() {
//         if (document.hidden !== void 0) {
//             this.hidden = "hidden";
//             this.visibilityChange = "visibilitychange";
//         } else if (document.hidden !== void 0) {
//             this.hidden = "webkitHidden";
//             this.visibilityChange = "webkitvisibilitychange";
//         } else if (document.hidden !== void 0) {
//             this.hidden = "mozhidden";
//             this.visibilityChange = "mozvisibilitychange";
//         } else if (document.hidden !== void 0) {
//             this.hidden = "mshidden";
//             this.visibilityChange = "msvisibilitychange";
//         }
//     },
//     supportFullScreen: function() {
//         this._fullScreenRequest();
//         this._fullScreenExit();
//         this._fullScreenOnChange();
//         this.support.fullScreen = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
//     },
//     _fullScreenRequest: function() {
//         var element = document.documentElement;
//         if (element.requestFullscreen !== void 0) {
//             this.fullScreenRequest = "requestFullscreen";
//         } else if (element.webkitRequestFullscreen !== void 0) {
//             this.fullScreenRequest = "webkitRequestFullscreen";
//         } else if (element.mozRequestFullScreen !== void 0) {
//             this.fullScreenRequest = "mozRequestFullScreen";
//         } else if (element.msRequestFullscreen !== void 0) {
//             this.fullScreenRequest = "msRequestFullscreen";
//         }
//     },
//     _fullScreenExit: function() {
//         if (document.exitFullscreen !== void 0) {
//             this.fullScreenExit = "exitFullscreen";
//         } else if (document.webkitExitFullscreen !== void 0) {
//             this.fullScreenExit = "webkitExitFullscreen";
//         } else if (document.mozCancelFullScreen !== void 0) {
//             this.fullScreenExit = "mozCancelFullScreen";
//         } else if (document.msExitFullscreen !== void 0) {
//             this.fullScreenExit = "msExitFullscreen";
//         }
//     },
//     _fullScreenOnChange: function() {
//         if (document.onfullscreenchange !== void 0) {
//             this.fullScreenOnChange = "fullscreenchange";
//         } else if (document.onwebkitfullscreenchange !== void 0) {
//             this.fullScreenOnChange = "webkitfullscreenchange";
//         } else if (document.onmozfullscreenchange !== void 0) {
//             this.fullScreenOnChange = "mozfullscreenchange";
//         } else if (document.onmsfullscreenchange !== void 0) {
//             this.fullScreenOnChange = "msfullscreenchange";
//         }
//     },
//     supportRequestAnimFrame: function() {
//         if (!window.requestAnimationFrame) {
//             window.requestAnimationFrame = function() {
//                 return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
//                     window.setTimeout(callback, 1e3 / 60);
//                 };
//             }();
//         }
//     },
//     supportPerformanceNow: function() {
//         if (window.performance === void 0) {
//             window.performance = {};
//         }
//         if (window.performance.now === void 0) {
//             window.performance.now = Date.now;
//         }
//     },
//     supportAudioFormats: function() {
//         var audio = document.createElement("audio");
//         if (audio.canPlayType("audio/mp4")) {
//             this.audioFormats.push("m4a");
//         }
//         if (audio.canPlayType("audio/ogg")) {
//             this.audioFormats.push("ogg");
//         }
//         if (audio.canPlayType("audio/mpeg")) {
//             this.audioFormats.push("mp3");
//         }
//         if (audio.canPlayType("audio/wav")) {
//             this.audioFormats.push("wav");
//         }
//     },
//     supportAudioAPI: function() {
//         if (!window.AudioContext) {
//             window.AudioContext = window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
//         }
//         if (window.AudioContext) {
//             this.audioAPI = true;
//         }
//     },
//     supportFileSystemAPI: function() {
//         if (!window.requestFileSystem) {
//             window.requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.oRequestFileSystem || window.msRequestFileSystem;
//         }
//         if (window.requestFileSystem) {
//             this.support.fileSystemAPI = true;
//         }
//     }
// };

// meta.device = new meta.Device();