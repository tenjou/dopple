"use strict";

Expression.Object = function(name, def) {
	this.name = name;
	this.str = "[object Object]";
	this.type = Variable.Type.OBJECT;
	this.def = def;
};

Expression.Object.prototype = new Expression.Base(Expression.Type.OBJECT);