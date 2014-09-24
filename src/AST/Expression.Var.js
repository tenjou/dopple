"use strict";

Expression.Var = function(name)
{
	this.name = name || "";
	this.expr = null;
	this.var = null;
	this.value = "";
};

Expression.Var.prototype = new Expression.Base(Expression.Type.VAR);

Expression.Var.prototype.analyse = function()
{	
	var exprType = Expression.Type;

	if(this.expr.exprType === exprType.BINARY) {
		this.type = this.analyseBinExpr(this.expr);
	}
	else if(this.expr.exprType === exprType.VAR) {
		this.type = this.expr.var.type;
	}
	else {
		this.type = this.expr.type;
	}

	if(this === this.var) {
		return;
	}
	else 
	{
		if(this.var.type === 0) { return; }

		if(this.type !== this.var.type) 
		{
			Lexer.throw(Lexer.Error.INVALID_TYPE_CONVERSION, 
				"\"" + this.var.name + "\" " + this.var.strType() + " to " + this.expr.strType());
		}
	}
};

Expression.Var.prototype.analyseBinExpr = function(binExpr)
{
	var lhsType;
	if(binExpr.lhs.exprType === Expression.Type.BINARY) {
		lhsType = this.analyseBinExpr(binExpr.lhs);
	}
	else {
		lhsType = binExpr.lhs.type;
	}

	var rhsType;
	if(binExpr.rhs.exprType === Expression.Type.BINARY) {
		rhsType = this.analyseBinExpr(binExpr.rhs);
	}
	else {
		rhsType = binExpr.rhs.type;
	}

	if(lhsType !== rhsType) 
	{
		if(lhsType === Variable.Type.STRING_OBJ || rhsType === Variable.Type.STRING_OBJ) {
			return Variable.Type.STRING_OBJ;
		}
		else 
		{
			Lexer.throw(Lexer.Error.INVALID_TYPE_CONVERSION, "\"" + 
				this.var.name + "\" " + binExpr.lhs.strType() + " to " + binExpr.rhs.strType());
		}
	}

	return lhsType;
};
