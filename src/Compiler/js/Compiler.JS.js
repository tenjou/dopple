"use strict";

Compiler.JS = Compiler.Basic.extend
({
	make: function()
	{
		this.define(this.global);

		this.output += "function main() \n{\n";
		this.incTabs();

		this.decTabs();
		this.output += "}\n\n";
		this.output += "main();\n";	
	},

	define: function(scope)
	{
		this.scope = scope;

		var i;
		var expr, exprType;

		var defs = scope.defBuffer;
		var numDefs = defs.length;
		if(numDefs)
		{
			for(i = 0; i < numDefs; i++) 
			{
				expr = defs[i];
				exprType = expr.exprType;

				if(exprType === this.exprEnum.VAR) {
					this.defineVar(expr);
				}
			}			
		}		

		this.output += "\n";
	},

	defineVar: function(varExpr)
	{
		this.output += this.tabs;

		var expr = varExpr.expr;
		if(expr) 
		{
			this.output += "var " + varExpr.name + " = ";
			this.defineExpr(expr);
			this.output += ";\n";
		}

			// var exprType = expr.exprType;	
			// if(exprType === this.exprEnum.VAR) 
			// {
			// 		this.output += this.varMap[varExpr.type] + varExpr.name + ";\n";
			// 	}
			// 	else {
			// 		this.output += this.varMap[varExpr.type] + varExpr.name + " = " + expr.name + ";\n";
			// 	}
			// }
			// else if(exprType === this.exprEnum.STRING) {
			// 	this.output += this.varMap[varExpr.type] + varExpr.name + " = \"" + expr.hexLength + "\"\"" + expr.value + "\";\n";
			// }
			// else 
			// {
			// 	if(this.scope === this.global && varExpr.expr.exprType === Expression.Type.BINARY) {
			// 		this.output += this.varMap[varExpr.type] + varExpr.name + ";\n";
			// 	}
			// 	else {				
			// 		this.output += "var " + varExpr.name + " = ";
			// 		this.defineExpr(expr);
			// 		this.output += ";\n";
			// 	}
			// }	
		//}			
	},

	defineExpr: function(expr)
	{
		var exprType = expr.exprType;

		if(exprType === this.exprEnum.NUMBER || exprType === this.exprEnum.VAR) {
			this.output += expr.value;
		}
		else if(exprType === this.exprEnum.STRING) {
			this.output += "\"" + expr.value + "\"";
		}
		else if(exprType === this.exprEnum.BINARY) {
			this.defineExpr(expr.lhs);
			this.output += " " + expr.op + " ";
			this.defineExpr(expr.rhs);
		}		
	}
});