"use strict";

Expression.Binary = function(op, lhs, rhs) {
	this.op = op;
	this.lhs = lhs;
	this.rhs = rhs;
};

Expression.Binary.prototype = new Expression.Base(Expression.Type.BINARY);

Expression.Binary.prototype.analyse = function()
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

	this.type = lhsType;	
};