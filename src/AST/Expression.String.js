"use strict";

Expression.String = function(str) {
	this.value = str || "";
	this.type = Variable.Type.STRING;
};

Expression.String.prototype = new Expression.Base(Expression.Type.STRING);