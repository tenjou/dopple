"use strict";

var dopple = 
{
	compile: function(source) {
		var compiler = new Compiler();
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

dopple.Scope = function(parent)
{
	this.parent = parent || null;

	this.vars = {};
	this.defBuffer = [];
	this.varBuffer = [];
};