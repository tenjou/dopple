"use strict";

Expression.Object = function(name, scope) 
{
	this.name = name;
	this.str = "[object Object]";
	this.type = Variable.Type.OBJECT;
	this.scope = scope;

	this.isStatic = true;

	this.init();
};

Expression.Object.prototype = new Expression.Base(Expression.Type.OBJECT);

Expression.Object.prototype.init = function()
{
	var scope = new dopple.Scope(this.scope);
	this.constructFunc = new Expression.Function(this.name, scope, []);	
};