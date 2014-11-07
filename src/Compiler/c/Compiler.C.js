"use strict";

Compiler.C = Compiler.Basic.extend
({
	init: function() 
	{
		this.createLexer();

		this.varMap[this.varEnum.VOID] = "void ";
		this.varMap[this.varEnum.NUMBER] = "double ";
		this.varMap[this.varEnum.BOOL] = "int32_t ";
		this.varMap[this.varEnum.NAME] = "const char *";
		this.varMap[this.varEnum.STRING] = "char *";
	},

	createLexer: function()
	{
		var extern = this.lexer.extern;
		
		// var console = extern.obj("console");
		// console.func("log", [ this.varEnum.FORMAT ]);
		// console.func("warn", [ this.varEnum.FORMAT ]);
		// console.func("error", [ this.varEnum.FORMAT ]);

		// // var NAME = extern.obj("NAME");
		// // NAME.getter("length", null, Variable.Type.NUMBER);
		// // NAME.setter("length", [ Variable.Type.NUMBER, "value" ]);

		// extern.func("alert", [ this.varEnum.STRING ]);
		// extern.func("confirm", [ this.varEnum.STRING ]);
	},

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

				if(exprType === this.exprEnum.VAR) {
					this.makeVar(expr);
				}
				else if(exprType === this.exprEnum.FUNCTION) {
					this.output += this.tabs + this.makeFunction(expr);
				}
				else if(exprType === this.exprEnum.FUNCTION_CALL) {
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

				if(exprType === this.exprEnum.VAR) {
					this.defineVar(expr);
				}
				else if(exprType === this.exprEnum.FUNCTION) {
					this.defineFunc(expr);
					exprType = 0;
				}
				else if(exprType === this.exprEnum.FUNCTION_CALL) {
					this.defineFuncCall(expr);
				}
				else if(exprType === this.exprEnum.OBJECT) {
					this.defineObject(expr);
					exprType = 0;
				}
				else if(exprType === this.exprEnum.RETURN) {
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

					if(exprType === this.exprEnum.VAR) 
					{
						if(expr.parentList) { continue; }
						this.makeVar(expr);
					}
					else if(exprType === this.exprEnum.RETURN) {
						this.defineReturn(expr);
					}				
				}
			}
		}
	},


	defineVar: function(varExpr)
	{
		if(varExpr.type === this.varEnum.VOID) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + this.makeVarName(varExpr) + "\" is discarded - void type.");
			return;
		}

		this.output += this.tabs;

		var expr = varExpr.expr;
		if(expr) 
		{
			var exprType = expr.exprType;

			if(varExpr.parentList)
			{
				if(exprType === this.exprEnum.VAR) {
					this.output += this.makeVarName(expr) + expr.name + ";\n";
				}
				else if(exprType === this.exprEnum.STRING) {
					this.output += this.makeVarName(varExpr) + " = \"" + expr.hexLength + "\"\"" + expr.value + "\";\n";
				}
				else {
					this.output += this.makeVarName(varExpr) + " = ";
					this.defineExpr(expr);
					this.output += ";\n";
				}
			}
			else 
			{
				if(exprType === this.exprEnum.VAR) 
				{
					if(this.scope === this.global) {
						this.output += this.varMap[varExpr.type] + varExpr.name + ";\n";
					}
					else {
						this.output += this.varMap[varExpr.type] + varExpr.name + " = " + expr.name + ";\n";
					}
				}
				else if(exprType === this.exprEnum.STRING) {
					this.output += this.varMap[varExpr.type] + varExpr.name + " = \"" + expr.hexLength + "\"\"" + expr.value + "\";\n";
				}
				else 
				{
					if(this.scope === this.global && varExpr.expr.exprType === this.exprEnum.BINARY) {
						this.output += this.varMap[varExpr.type] + varExpr.name + ";\n";
					}
					else {				
						this.output += this.varMap[varExpr.type] + varExpr.name + " = ";
						this.defineExpr(expr);
						this.output += ";\n";
					}
				}
			}			
		}
		else {
			this.output += this.makeVarName(varExpr) + " = " + varExpr.defaultValue() + ";\n";
		}
	},

	defineExpr: function(expr)
	{
		var exprType = expr.exprType;

		if(exprType === this.exprEnum.NUMBER || exprType === this.exprEnum.VAR) {
			this.output += expr.value;
		}
		else if(exprType === this.exprEnum.BINARY) {
			this.defineExpr(expr.lhs);
			this.output += " " + expr.op + " ";
			this.defineExpr(expr.rhs);
		}
	},

	defineFunc: function(func)
	{
		var params = func.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		// Write head:
		this.output += this.varMap[func.returnVar.type] + this.makeFuncName(func) + "(";

		// Write parameters:
		if(numParams) 
		{
			var varDef;
			for(var i = 0; i < numParams - 1; i++) 
			{
				varDef = params[i];
				if(varDef.type !== 0) {
					this.output += this.varMap[varDef.type] + varDef.name + ", ";
				}
				else {
					this.output += "double " + varDef.name + ", ";
				}
			}
			varDef = params[i];
			if(varDef.type !== 0) {
				this.output += this.varMap[varDef.type] + varDef.name;
			}
			else {
				this.output += "double " + varDef.name;
			}
		}

		this.output += ") \n{\n";
		
		// Write body:
		this.incTabs();
		this.define(func.scope);
		this.decTabs();

		this.output += "}\n";
	},

	defineObject: function(obj)
	{
		var defBuffer = obj.scope.defBuffer;
		var numDefs = defBuffer.length;

		this.output += "static struct {\n";

		this.incTabs();

		var varExpr;
		for(var i = 0; i < numDefs; i++) 
		{
			varExpr = defBuffer[i];
			if(varExpr.type > 0) {
				this.output += this.tabs + this.varMap[varExpr.type] + varExpr.name + ";\n";
			}
		}

		this.decTabs();

		this.output += "} " + obj.name + ";\n";
	},

	defineReturn: function(returnExpr) 
	{
		this.output += this.tabs;

		if(returnExpr.expr) {
			this.output += "return ";
			this.defineExpr(returnExpr.expr);
			this.output += ";\n";
		}
		else {
			this.output += "return;\n";
		}
	},

	makeVar: function(varExpr)
	{
		if(varExpr.type === this.varEnum.VOID) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - void type.");
			return "";
		}

		varExpr.fullName = this.makeVarName(varExpr);
		this.outputBuffer += this.tabs + varExpr.fullName + " = ";

		var expr = varExpr.expr;
		if(expr.exprType === this.exprEnum.NUMBER) {
			this.outputBuffer += expr.value;
		}
		else if(expr.exprType === this.exprEnum.VAR) {
			this.outputBuffer += expr.name;
		}		
		else if(expr.exprType === this.exprEnum.STRING) {
			this.outputBuffer += "\"" + expr.hexLength + "\"\"" + expr.value + "\"";
		}
		else if(expr.exprType === this.exprEnum.BINARY) {
			this._makeVarBinary(varExpr, expr);
		}
		else {
			this.outputBuffer += expr.value;
		}

		this.outputBuffer += ";\n";

		this.output += this.outputBuffer;
		this.outputBuffer = "";
	},	

	_makeVarBinary: function(varExpr, binExpr)
	{
		var output = "";

		if(varExpr.type === this.varEnum.STRING) 
		{
			this.genConcat(varExpr.fullName, binExpr.lhs, binExpr.rhs);

			return output;
		}

		var lhsValue;
		if(binExpr.lhs.exprType === this.exprEnum.BINARY) {
			lhsValue = this._makeVarBinary(binExpr.lhs);
		}
		else 
		{
			if(binExpr.lhs.type === this.varEnum.STRING) {
				lhsValue = "\"" + binExpr.lhs.str + "\"";
			}
			else {
				lhsValue = binExpr.lhs.value;
			}
		}

		var rhsValue;
		if(binExpr.rhs.exprType === this.exprEnum.BINARY) {
			rhsValue = this._makeVarBinary(binExpr.rhs);
		}
		else 
		{
			if(binExpr.rhs.type === this.varEnum.NAME) {
				rhsValue = "\"" + binExpr.rhs.str + "\"";
			}
			else {
				rhsValue = binExpr.rhs.value;
			}
		}

		return lhsValue + " " + binExpr.op + " " + rhsValue;
	},	

	genConcat: function(name, lhs, rhs)
	{
		this.outputBuffer = this.tabs + name + " = malloc(__dopple_strLength + NUMBER_SIZE);\n";
		this.output += this.tabs + "__dopple_strOffset = NUMBER_SIZE;\n";
		this.output += this.tabs + "__dopple_strLength = ";

		this.genConcatExpr(name, lhs);
		this.genConcatExpr(name, rhs, true);

		this.outputBuffer += this.tabs + "APPEND_LENGTH(" + name + ", __dopple_strLength);\n\n";		
	},

	genConcatExpr: function(name, expr, last)
	{
		if(expr.exprType === this.exprEnum.BINARY) {
			this.genConcatExpr(name, expr.lhs, false);
			this.genConcatExpr(name, expr.rhs, last);
		}
		else if(expr.exprType === this.exprEnum.VAR) 
		{
			if(expr.type === this.varEnum.STRING) 
			{
				this.outputBuffer += this.tabs + "memcpy(" + name + " + __dopple_strOffset, " + 
					expr.name + " + NUMBER_SIZE, (*(NUMBER *)" + expr.name + "));\n";
				if(!last) {
					this.outputBuffer += this.tabs + "__dopple_strOffset += (*(NUMBER *)" + expr.name + ");\n";
					this.output += "(*(NUMBER *)" + expr.name + ") + ";
				}
				else {
					this.output += "(*(NUMBER *)" + expr.name + ");\n";
				}
			}
			else if(expr.type === this.varEnum.NUMBER)
			{
				this.outputBuffer += this.tabs + "__dopple_tmp = snprintf(NULL, 0, \"%.17g\", " + expr.value + ");\n";
				this.outputBuffer += this.tabs + "snprintf(" + name + 
					" + __dopple_strOffset, __dopple_tmp + 1, \"%.17g\", " + expr.name + ");\n"	
				if(!last) {
					this.outputBuffer += this.tabs + "__dopple_strOffset += __dopple_tmp;\n";
					this.output += "__dopple_tmp + ";
				}
				else {
					this.output += "__dopple_tmp;\n";
				}								
			}
			else {
				throw "genConcatExpr: Unhandled expression variable type!";
			}
		}
		else if(expr.exprType === this.exprEnum.STRING) 
		{
			this.outputBuffer += this.tabs + "memcpy(" + name + " + __dopple_strOffset, \"" + 
				expr.value + "\", " + expr.length + ");\n"
			if(!last) {
				this.outputBuffer += this.tabs + "__dopple_strOffset += " + expr.length + ";\n";
				this.output += expr.length + " + ";
			}
			else {
				this.output += expr.length + ";\n";
			}
		}
		else if(expr.exprType === this.exprEnum.NUMBER)
		{
			this.outputBuffer += this.tabs + "__dopple_tmp = snprintf(NULL, 0, \"%.17g\", " + expr.value + ");\n";
			this.outputBuffer += this.tabs + "snprintf(" + name + 
				" + __dopple_strOffset, __dopple_tmp, \"%.17g%\, " + expr.value + ");\n"
		}
		else {
			throw "genConcatExpr: Unhandled expression type!";
		}		
	},

	makeFuncCall: function(funcCall) 
	{
		var params = funcCall.func.params;
		var args = funcCall.args;
		var numArgs = funcCall.func.numParams;

		this.output += this.tabs + this.makeFuncName(funcCall.func) + "(";

		// Write arguments, if there is any:
		if(numArgs > 0)
		{
			if(params[0].type === this.varEnum.FORMAT) {
				this.makeFormat(args);
			}
			else
			{
				var arg = args[0];
				var param = params[0];
				if(arg === param) {
					this.output += param.var.defaultValue();
				}
				else {
					this.output += arg.castTo(param);
				}

				for(var i = 1; i < numArgs; i++) 
				{
					this.output += ", ";

					arg = args[i];
					param = params[i];
					if(arg === param) {
						this.output += param.var.defaultValue();
					}
					else {
						this.output += arg.castTo(param);
					}
				}
			}
		}

		this.output += ");\n";
	},	

	makeVarName: function(varExpr)
	{
		var parentList = varExpr.parentList;
		if(!parentList) {
			return varExpr.name;
		}

		var numItems = parentList.length;
		if(numItems <= 0) {
			return varExpr.name;
		}
		
		var name = "";
		for(var i = 0; i < numItems; i++) {
			name += parentList[i].name + ".";
		}
		name += varExpr.name;

		return name;
	},

	makeFuncName: function(funcExpr)
	{
		var parentList = funcExpr.parentList;
		if(!parentList) {
			return funcExpr.name;
		}

		var numItems = parentList.length;
		if(numItems <= 0) {
			return funcExpr.name;
		}
		
		var name = "";
		for(var i = 0; i < numItems; i++) {
			name += parentList[i].name + "$";
		}
		name += funcExpr.name;

		return name;		
	},	

	makeFormat: function(args)
	{
		var output = "\"";
		var argOutput = "";

		var arg, exprType, varType;
		var numArgs = args.length;
		for(var i = 0; i < numArgs; i++)
		{
			arg = args[i];
			exprType = arg.exprType;

			if(exprType === this.exprEnum.NUMBER) {
				output += "%f ";
				argOutput += "(double)" + arg.value + ", ";
			}
			else if(exprType === this.exprEnum.STRING) {
				output += "%s ";
				argOutput += "\"" + arg.value + "\"" + ", ";
			}
			else if(exprType === this.exprEnum.VAR) 
			{
				varType = arg.type;
				if(varType === this.varEnum.STRING) {
					output += "%s ";
					argOutput += arg.value + " + NUMBER_SIZE, ";
				}
				else {
					output += "%f ";
					argOutput += "(double)" + arg.value + ", ";
				}
			}
			else {
				throw "Compiler.makeFormat: Unhandled case.";
			}
		}

		output = output.substr(0, output.length - 1) + "\\n\"";
		argOutput = argOutput.substr(0, argOutput.length - 2);
		this.output += output + ", " + argOutput;
	},

	//
	varMap: {}
});
