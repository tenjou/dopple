"use strict";

Expression.String = function(str) {
	this.value = str;
	this.type = Variable.Type.STRING;
	this.length = ToHex(str.length) + "\\x0\\x0\\x0";
};

Expression.String.prototype = new Expression.Base(Expression.Type.STRING);