"use strict";

Expression.Function = function(name, scope, params) {
	this.name = name;
	this.scope = scope;
	this.params = params;
	this.numParams = (params) ? params.length : 0;
	this.returnVar = new Expression.Var("");
};

Expression.Function.prototype = new Expression.Base(Expression.Type.FUNCTION);