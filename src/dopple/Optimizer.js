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
		// Check if we have something to optimize:
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

		if(expr.lhs.exprType === this.exprEnum.BINARY) 
		{
			var lhsRhs = expr.lhs.rhs;
			var lhsRhs = this._resolve(expr, lhsRhs, expr.rhs);
			if(lhsRhs !== expr) {
				lhs.rhs = lhsRhs;
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

		if(lhsExprType === this.exprEnum.NUMBER)
		{
			if(rhsExprType === this.exprEnum.NUMBER ||
			   rhsExprType === this.exprEnum.BOOL) 
			{ 
				srcExpr = lhs; 
			}
			else if(rhsExprType === this.exprEnum.STRING) { srcExpr = rhs; }
			else {
				return expr;
			}
		}
		else if(lhsExprType === this.exprEnum.STRING) 
		{
			if(rhsExprType === this.exprEnum.NUMBER || 
		       rhsExprType === this.exprEnum.STRING) 
			{ 
				srcExpr = lhs;
			}
			else if(rhsExprType === this.exprEnum.BOOL) {
				rhs.value = rhs.str();
				srcExpr = lhs; 				
			}
			else {
				return expr;
			}		
		}		
		else if(lhsExprType === this.exprEnum.BOOL)
		{
			if(rhsExprType === this.exprEnum.NUMBER) { srcExpr = rhs; }
			else if(rhsExprType === this.exprEnum.STRING) { 
				lhs.value = lhs.str();
				srcExpr = rhs; 
			}
			else if(rhsExprType === this.exprEnum.BOOL) { srcExpr = new AST.Number(0); }
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
	}
};