"use strict";

var dopple = {
	lexer: null,
	isError: false
};

if(typeof(exports) !== "undefined") {
	dopple.isNodeJS = true;	
	module.exports.dopple = dopple;
}
else {
	dopple.isNodeJS = false;
}