"use strict";

dopple.Compiler.JSON = function() 
{
	this.scope = null;
	this.globalScope = null;
};

dopple.Compiler.JSON.prototype =
{
	parse: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;

		var result = {};

		return result;
	}
};
