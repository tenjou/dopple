"use strict";

Expression.StringObj = function(str) {
	this.value = str || "";
	this.type = Variable.Type.STRING_OBJ;
	this.length = ToHex(str.length) + "\\x0\\x0\\x0";
};

Expression.StringObj.prototype = new Expression.Base(Expression.Type.STRING_OBJ);