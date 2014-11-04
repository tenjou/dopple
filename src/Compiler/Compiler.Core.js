"use strict";

var Compiler = {};

Compiler.Core = dopple.Class.extend
({
	compileAST: function(ast) 
	{
		if(!(ast instanceof dopple.Scope)) {
			this.global = [ ast ];
		}
		else {
			this.global = ast;
		}

		return this.make();
	},

	//
	output: null,

	global: null,
	scope: null	
});