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

		// if(expr.lhs.exprType === this.exprEnum.BINARY) {
		// 	expr.lhs = this._tryMerge(expr.lhs, expr.rhs);
		// }

		var srcExpr;
		var lhsExprType = expr.lhs.exprType;
		var rhsExprType = expr.rhs.exprType;

		if(lhsExprType === this.exprEnum.NUMBER)
		{
			if(rhsExprType === this.exprEnum.NUMBER ||
			   rhsExprType === this.exprEnum.BOOL) 
			{ 
				srcExpr = expr.lhs; 
			}
			else if(rhsExprType === this.exprEnum.STRING) { srcExpr = expr.rhs; }
			else {
				return expr;
			}
		}
		else if(lhsExprType === this.exprEnum.STRING) 
		{
			if(rhsExprType === this.exprEnum.NUMBER || 
		       rhsExprType === this.exprEnum.STRING) 
			{ 
				srcExpr = expr.lhs;
			}
			else if(rhsExprType === this.exprEnum.BOOL) {
				expr.rhs.value = expr.rhs.str();
				srcExpr = expr.lhs; 				
			}
			else {
				return expr;
			}		
		}		
		else if(lhsExprType === this.exprEnum.BOOL)
		{
			if(rhsExprType === this.exprEnum.NUMBER) { srcExpr = expr.rhs; }
			else if(rhsExprType === this.exprEnum.STRING) { 
				expr.lhs.value = expr.lhs.str();
				srcExpr = expr.rhs; 
			}
			else if(rhsExprType === this.exprEnum.BOOL) { srcExpr = new Expression.Number(0); }
			else { 
				return expr;
			}
		}
		else {
			return expr;
		}	

		// var lhsType = expr.lhs.type;
		// var rhsType = expr.rhs.type;

		// if((lhsType === this.varEnum.NUMBER || lhsType === this.varEnum.STRING) &&
		//    (rhsType === this.varEnum.NUMBER || rhsType === this.varEnum.STRING)) 
		// {}
		// else { return expr; }

		var op = expr.op;
		if(op === "+") {
			srcExpr.value = expr.lhs.value + expr.rhs.value;
		}
		else if(op === "-") {
			srcExpr.value = expr.lhs.value - expr.rhs.value;
		} 
		else if(op === "*") {
			srcExpr.value = expr.lhs.value * expr.rhs.value;
		}
		else if(op === "/") {
			srcExpr.value = expr.lhs.value / expr.rhs.value;
		}

		return srcExpr;
	},

	_tryMerge: function(expr, rhs)
	{
		while(rhs.exprType === this.exprEnum.BINARY) {
			rhs = rhs.lhs;
		}

		var op = expr.op;
		if(op === "+") {
			srcExpr.value = expr.lhs.value + rhs.value;
		}
		else if(op === "-") {
			srcExpr.value = expr.lhs.value - rhs.value;
		} 
		else if(op === "*") {
			srcExpr.value = expr.lhs.value * rhs.value;
		}
		else if(op === "/") {
			srcExpr.value = expr.lhs.value / rhs.value;
		}		

		return;
	}
};