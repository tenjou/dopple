"use strict";

Expression.FunctionCall = function(func, args) 
{
	this.func = func;
	this.args = args;
};

Expression.FunctionCall.prototype = new Expression.Base(Expression.Type.FUNCTION_CALL);