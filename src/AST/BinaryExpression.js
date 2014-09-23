"use strict";

Expression.Binary = function(op, lhs, rhs) {
	this.op = op;
	this.lhs = lhs;
	this.rhs = rhs;
};

Expression.Binary.prototype = new Expression.Base(Expression.Type.BINARY);