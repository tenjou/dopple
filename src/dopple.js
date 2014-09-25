"use strict";

var dopple = 
{
	compile: function(source, headers) {
		var compiler = new Compiler(headers);
		return compiler.compile(source);
	}
};

if(typeof(exports) !== "undefined") {
	dopple.isNodeJS = true;	
	module.exports.dopple = dopple;
}
else {
	dopple.isNodeJS = false;
}