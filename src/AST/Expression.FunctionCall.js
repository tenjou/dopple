"use strict";

Expression.FunctionCall = function(name, params) {
	this.name = name;
	this.params = params;
};

Expression.FunctionCall.prototype = new Expression.Base(Expression.Type.FUNCTION_CALL);