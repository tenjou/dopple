"use strict";

function Optimizer() 
{
	this.exprEnum = Expression.Type;
};

Optimizer.prototype =
{
	do: function(expr) 
	{
		// Check if we have something to optimize.
		if(expr.exprType !== Expression.Type.BINARY) { return expr; }
		if(!expr.lhs && !expr.rhs) { return expr; }

		return this._doExpr(expr);
	},

	_doExpr: function(expr)
	{
		var lhsType = expr.lhs.exprType;
		var rhsType = expr.rhs.exprType;

		if(lhsType === this.exprEnum.BINARY) {
			expr.lhs = this._doExpr(expr.lhs);
			lhsType = expr.lhs.exprType;
		}
		if(rhsType === this.exprEnum.BINARY) {
			expr.rhs = this._doExpr(expr.rhs);
			rhsType = expr.rhs.exprType;
		}

		if((lhsType === this.exprEnum.NUMBER || lhsType === this.exprEnum.STRING) &&
		   (rhsType === this.exprEnum.NUMBER || rhsType === this.exprEnum.STRING)) 
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