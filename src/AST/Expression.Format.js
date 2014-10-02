"use strict";

Expression.Format = function(name, scope) 
{
	this.name = name;
	this.type = Variable.Type.FORMAT;
};

Expression.Format.prototype = new Expression.Base(Expression.Type.FORMAT);

Expression.Format.prototype.defaultValue = function() {
	return '"\\n"';
};