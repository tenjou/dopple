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

	tabs: "",
	output: "",
	outputBuffer: "",	

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
});