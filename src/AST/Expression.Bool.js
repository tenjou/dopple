"use strict";

Expression.Bool = function(value) {
	this.value = value * 1;
	this.type = Variable.Type.BOOL;
};

Expression.Bool.prototype = new Expression.Base(Expression.Type.BOOL);