"use strict";

Expression.Number = function(value) {
	this.value = value;
	this.type = Variable.Type.NUMBER;
};

Expression.Number.prototype = new Expression.Base(Expression.Type.NUMBER);