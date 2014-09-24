"use strict";

Expression.Var = function(name)
{
	this.name = name || "";
	this.expr = null;
	this.var = null;
	this.value = "";
};

Expression.Var.prototype = new Expression.Base(Expression.Type.VAR);

Expression.Var.prototype.write = function(str, param){
	this.var.write(str, param);
};

Expression.Var.prototype.cast = function(str, expr) 
{
	if(this.var) {
		this.var.castFromExpr(str, expr);
	}
	else {
		this.expr.castFromType(str, this.type);
	}
};

Expression.Var.prototype.analyse = function()
{	
	this.type = this.expr.type;

	// if(this === this.var) {
	// 	return;
	// }
	// else 
	// {
	// 	if(this.var.type === 0) { return; }

	// 	if(this.type !== this.var.type) 
	// 	{
	// 		Error.throw(Error.Type.INVALID_TYPE_CONVERSION, 
	// 			"\"" + this.var.name + "\" " + this.var.strType() + " to " + this.expr.strType());
	// 	}
	// }
};
