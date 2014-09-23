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
		var lhs = expr.lhs;
		var rhs = expr.rhs;
		var lhsType = lhs.exprType;
		var rhsType = rhs.exprType;

		if(lhsType === this.exprEnum.BINARY) {
			expr.lhs = this._doExpr(lhs);
			lhsType = expr.lhs.exprType;
		}
		if(rhsType === this.exprEnum.BINARY) {
			expr.rhs = this._doExpr(rhs);
			rhsType = expr.rhs.exprType;
		}

		if((lhsType === this.exprEnum.NUMBER || lhsType === this.exprEnum.STRING) &&
		   (rhsType === this.exprEnum.NUMBER || rhsType === this.exprEnum.STRING)) 
		{}
		else { return expr; }

		var result;
		var op = expr.op;

		if(op === "+") {
			result = lhs.value + rhs.value;
		}
		else if(op === "-") {
			result = lhs.value - rhs.value;
		} 
		else if(op === "*") {
			result = lhs.value * rhs.value;
		}
		else if(op === "/") {
			result = lhs.value / rhs.value;
		}

		if(typeof(result) === "string") {
			return new Expression.String(result);
		}

		return new Expression.Number(result);
	}
};