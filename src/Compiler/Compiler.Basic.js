"use strict";

var Compiler = {};

Compiler.Basic = dopple.Class.extend
({
	_init: function(lexer) 
	{
		if(!lexer) {
			console.error("Compiler:", "Invalid lexer has been passed in the constructor.");
			return;
		}

		this.lexer = lexer;
	},

	compile: function(source)
	{
		this.output = "";
		
		if(this.lexer.read(source)) {
			this.global = this.lexer.global;
			this.make();
		}

		return this.output;	
	},	

	incTabs: function() {
		this.tabs += "\t";
	},

	decTabs: function() {
		this.tabs = this.tabs.substr(0, this.tabs.length - 1);
	},	


	//
	lexer: null,

	global: null,
	scope: null,
	scopeInfo: null,

	tabs: "",
	output: "",
	outputBuffer: "",
	outputExpr: "",
	outputScope: "",

	outputPre: "",
	outputPost: "",
	outputLength: "",	

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
});

dopple.ScopeInfo = function() {
	this.parent = null;
	this.tmps = null;
};

dopple.ScopeInfo.prototype = 
{
	addTmpNumber: function() 
	{
		if(!this.tmps) {
			this.tmps = [];
		}

		var tmp = "temp" + this.tmps.length;
		this.tmps.push(tmp);
		return tmp;
	},

	emitTmpNumbers: function() 
	{
		if(!this.tmps) {
			return "";
		}

		var numTmps = this.tmps.length;
		if(numTmps > 1)
		{
			var output = "";
			for(var i = 0; i < numTmps; i++) {
				output += this.tmps[i] + ", ";
			}

			return output;
		}

		return this.tmps[0];
	},
};
