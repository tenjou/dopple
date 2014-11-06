"use strict";

Expression.Var = function(name, parentList, type)
{
	this.name = name || "";
	this.type = type || 0;
	this.expr = null;
	this.var = null;
	this.value = "";
	this.parentList = parentList || null;
	this.fullName = "";
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

Expression.Var.prototype.defaultValue = function() 
{
	var varEnum = Variable.Type;
	if(this.type === 0 || this.type === varEnum.NUMBER) {
		return "NaN";
	}
	else if(this.type === varEnum.STRING) {
		return "\"undefined\"";
	}
	else if(this.type === varEnum.STRING_OBJ) {
		return "\"\\x9\\x0\\x0\\x0\"\"undefined\"";
	}
	else {
		throw "Expression.Var.defaultValue: Invalid conversion.";
	}
};

Expression.Var.prototype.analyse = function()
{	
	if(!this.expr) { return; }
	
	if(this.expr.exprType === Expression.Type.BINARY) {
		this.type = this.analyseExpr(this.expr);
	}
	else
	{
		if(this.type !== 0 && this.type !== this.expr.type) 
		{
			Error.throw(Error.Type.INVALID_TYPE_CONVERSION, 
		 			"\"" + this.var.name + "\" " + this.var.strType() + " to " + this.expr.strType());
		}
		
		this.type = this.expr.type;
	}
};

Expression.Var.prototype.analyseExpr = function(expr)
{
	var lhsType, rhsType;

	if(expr.lhs.exprType === Expression.Type.BINARY) {
		lhsType = this.analyseExpr(expr.lhs);
	}
	else {
		lhsType = expr.lhs.type;
	}

	if(expr.rhs.exprType === Expression.Type.BINARY) {
		rhsType = this.analyseExpr(expr.rhs);
	}
	else {
		rhsType = expr.rhs.type;
	}

	if(lhsType === rhsType) {
		return lhsType;
	}

	var varEnum = Variable.Type;
	if(lhsType === varEnum.STRING_OBJ || rhsType === varEnum.STRING_OBJ) {
		return varEnum.STRING_OBJ;
	}
	else 
	{
			Error.throw(Error.Type.INVALID_TYPE_CONVERSION, 
		 			"\"" + this.var.name + "\" " + this.var.strType() + " to " + this.expr.strType());		
	}

	return 0;
};

