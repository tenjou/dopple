"use strict";

dopple.Optimizer = function(lexer) {
	this.lexer = lexer;
	this.varEnum = dopple.VarEnum;
	this.exprEnum = dopple.ExprEnum;
};

dopple.Optimizer.prototype =
{
	do: function(expr) 
	{
		// Check if we have something to optimize.
		if(!expr) { return expr; }
		if(expr.exprType !== this.exprEnum.BINARY) { return expr; }
		if(!expr.lhs && !expr.rhs) { return expr; }

		return this._doExpr(expr);
	},

	_doExpr: function(expr)
	{
		if(expr.lhs.exprType === this.exprEnum.BINARY) {
			expr.lhs = this._doExpr(expr.lhs);
		}
		if(expr.rhs.exprType === this.exprEnum.BINARY) {
			expr.rhs = this._doExpr(expr.rhs);
		}

		var lhsType = lhsType = expr.lhs.type;
		var rhsType = rhsType = expr.rhs.type;

		if((lhsType === this.varEnum.NUMBER || lhsType === this.varEnum.STRING) &&
		   (rhsType === this.varEnum.NUMBER || rhsType === this.varEnum.STRING)) 
		{}
		else { return expr; }

		var result;
		var op = expr.op;

		if(op === "+") {
			result = expr.lhs.value + expr.rhs.value;
		}
		else if(op === "-") {
			result = expr.lhs.value - expr.rhs.value;
		} 
		else if(op === "*") {
			result = expr.lhs.value * expr.rhs.value;
		}
		else if(op === "/") {
			result = expr.lhs.value / expr.rhs.value;
		}

		if(typeof(result) === "string") {
			return new Expression.String(result);
		}

		return new Expression.Number(result);
	}
};