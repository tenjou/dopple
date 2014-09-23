"use strict";

Expression.Return = function(expr) {
	this.expr = expr;
};

Expression.Return.prototype = new Expression.Base(Expression.Type.RETURN);