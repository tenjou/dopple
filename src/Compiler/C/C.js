"use strict";

Compiler.C = Compiler.Core.extend
({
	make: function()
	{
		this.output = "#include \"dopple.h\"\n\n";

		this.define(this.global);

		// Main start.
		this.output += "\nint main(int argc, char *argv[]) \n{\n";
		this.incTabs();

		// Expressions.
		var i;
		var varBuffer = this.lexer.global.varBuffer;
		var numExpr = varBuffer.length;
		if(numExpr)
		{
			var expr, exprType;
			for(i = 0; i < numExpr; i++)
			{
				expr = varBuffer[i];
				exprType = expr.exprType;

				if(exprType === ExprEnum.VAR) {
					this.makeVar(expr);
				}
				else if(exprType === ExprEnum.FUNCTION) {
					this.output += this.tabs + this.makeFunction(expr);
				}
				else if(exprType === ExprEnum.FUNCTION_CALL) {
					this.makeFuncCall(expr);
				}				
			}

			this.output += "\n";
		}

		// Main end.
		this.output += this.tabs + "return 0;\n";
		this.output += "}\n";

		return this.output;
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
			var prevExprType = defs[0].exprType;
			for(i = 0; i < numDefs; i++) 
			{
				expr = defs[i];
				exprType = expr.exprType;

				// Make newlines between diffrent expr types.
				if(exprType !== prevExprType) {
					this.output += "\n";
				}

				if(exprType === ExprEnum.VAR) {
					this.defineVar(expr);
				}
				else if(exprType === ExprEnum.FUNCTION) {
					this.defineFunc(expr);
					exprType = 0;
				}
				else if(exprType === ExprEnum.FUNCTION_CALL) {
					this.defineFuncCall(expr);
				}
				else if(exprType === ExprEnum.OBJECT) {
					this.defineObject(expr);
					exprType = 0;
				}
				else if(exprType === ExprEnum.RETURN) {
					this.defineReturn(expr);
				}
				else {
					console.log("unhandled");
				}

				prevExprType = exprType;
			}
		}

		if(scope !== this.global)
		{
			var vars = scope.varBuffer;
			var numVars = vars.length;
			if(numVars)
			{
				for(i = 0; i < numVars; i++) 
				{
					expr = vars[i];
					exprType = expr.exprType;

					if(exprType === ExprEnum.VAR) 
					{
						if(expr.parentList) { continue; }
						this.makeVar(expr);
					}
					else if(exprType === ExprEnum.RETURN) {
						this.defineReturn(expr);
					}				
				}
			}
		}
	},	
});