"use strict";

Expression.Function = function(name, scope, params) 
{
	this.name = name;
	this.type = Variable.Type.FUNCTION;
	this.scope = scope;

	this.params = params;
	this.numParams = (params) ? params.length : 0; 

	this.rootName = null;
	this.returnVar = new Expression.Var("");
};

Expression.Function.prototype = new Expression.Base(Expression.Type.FUNCTION);