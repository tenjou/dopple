"use strict";

dopple.optimizer = 
{
	do: function(expr) 
	{
		// Check if we have something to optimize:
		if(!expr) { return expr; }
		if(expr.exprType !== this.exprType.BINARY) { return expr; }
		if(!expr.lhs && !expr.rhs) { return expr; }

		return this._doExpr(expr);
	},

	_doExpr: function(expr)
	{
		if(expr.lhs.exprType === this.exprType.BINARY) {
			expr.lhs = this._doExpr(expr.lhs);
		}
		if(expr.rhs.exprType === this.exprType.BINARY) {
			expr.rhs = this._doExpr(expr.rhs);
		}

		if(expr.lhs.exprType === this.exprType.BINARY) 
		{
			var lhsRhs = expr.lhs.rhs;
			if(lhsRhs.type === this.exprType.NUMBER && expr.rhs.type === this.exprType.STRING) { 
				return expr;
			}			

			var lhsRhs = this._resolve(expr, lhsRhs, expr.rhs);
			if(lhsRhs !== expr) {
				expr.lhs.rhs = lhsRhs;
				return expr.lhs;
			}
			else {
				return expr;
			}			
		}
		
		return this._resolve(expr, expr.lhs, expr.rhs);
	},

	_resolve: function(expr, lhs, rhs)
	{
		var srcExpr;
		var lhsExprType = lhs.exprType;
		var rhsExprType = rhs.exprType;

		if(lhsExprType === this.exprType.NUMBER)
		{
			if(rhsExprType === this.exprType.NUMBER ||
			   rhsExprType === this.exprType.BOOL) 
			{ 
				srcExpr = lhs; 
			}
			else if(rhsExprType === this.exprType.STRING) { srcExpr = rhs; }
			else {
				return expr;
			}
		}
		else if(lhsExprType === this.exprType.STRING) 
		{
			if(rhsExprType === this.exprType.NUMBER || 
		       rhsExprType === this.exprType.STRING) 
			{ 
				srcExpr = lhs;
			}
			else if(rhsExprType === this.exprType.BOOL) {
				rhs.value = rhs.str();
				srcExpr = lhs; 				
			}
			else {
				return expr;
			}		
		}		
		else if(lhsExprType === this.exprType.BOOL)
		{
			if(rhsExprType === this.exprType.NUMBER) { srcExpr = rhs; }
			else if(rhsExprType === this.exprType.STRING) { 
				lhs.value = lhs.str();
				srcExpr = rhs; 
			}
			else if(rhsExprType === this.exprType.BOOL) { srcExpr = new dopple.AST.Number(0); }
			else { 
				return expr;
			}
		}
		else {
			return expr;
		}	

		var op = expr.op;
		if(op === "+") {
			srcExpr.value = lhs.value + rhs.value;
		}
		else if(op === "-") {
			srcExpr.value = lhs.value - rhs.value;
		} 
		else if(op === "*") {
			srcExpr.value = lhs.value * rhs.value;
		}
		else if(op === "/") {
			srcExpr.value = lhs.value / rhs.value;
		}

		return srcExpr;
	},

	//
	exprType: dopple.ExprType
};