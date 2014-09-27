"use strict";

Expression.Var = function(name, parentList)
{
	this.name = name || "";
	this.expr = null;
	this.var = null;
	this.value = "";
	this.parentList = parentList || null;
};

Expression.Var.prototype = new Expression.Base(Expression.Type.VAR);

Expression.Var.prototype.castTo = function(param)
{
	if(this.type === param.type) {
		return this.value;
	}
	else 
	{
		var varEnum = Variable.Type;
		if(param.type === varEnum.STRING) 
		{
			if(this.type === varEnum.STRING_OBJ) {
				return this.value + " + sizeof(int32_t)";
			}
			else {
				return this.value;				
			}
		}
		else 
		{
			dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, 
				"\"" + param.name + "\" from " + this.strType() + " to " + param.strType());
		}		
	}
};

Expression.Var.prototype.defaultValue = function() {
	return "0";
};

Expression.Var.prototype.analyse = function()
{	
	if(!this.expr) { return; }
	
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
