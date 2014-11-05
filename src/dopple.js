"use strict";

var dopple = {};

if(typeof(exports) !== "undefined") {
	dopple.isNodeJS = true;	
	module.exports.dopple = dopple;
}
else {
	dopple.isNodeJS = false;
}