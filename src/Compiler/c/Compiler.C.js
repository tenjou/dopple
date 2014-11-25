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
		
		var console = extern.obj("console");
		console.func("log", [ this.varEnum.FORMAT ]);
		console.func("warn", [ this.varEnum.FORMAT ]);
		console.func("error", [ this.varEnum.FORMAT ]);

		// var NAME = extern.obj("NAME");
		// NAME.getter("length", null, Variable.Type.NUMBER);
		// NAME.setter("length", [ Variable.Type.NUMBER, "value" ]);

		extern.func("alert", [ this.varEnum.STRING ]);
		extern.func("confirm", [ this.varEnum.STRING ]);
	},

	make: function()
	{
		this.output = "#include \"dopple.h\"\n\n";

		if(!this.define(this.global)) { 
			this.output = "";
			return false; 
		}

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

			this.scopeInfo = new dopple.ScopeInfo();

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

			if(this.scopeInfo.tmp_double) {
				this.output += this.tabs + "static double " + this.scopeInfo.emitTmpDouble() + ";\n";
			}
			if(this.scopeInfo.tmp_i32) {
				this.output += this.tabs + "static NUMBER " + this.scopeInfo.emitTmpI32() + ";\n\n";
			}			
			
			this.output += this.outputScope + "\n";
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
				else if(exprType === this.exprEnum.FUNCTION) 
				{
					if(!this.defineFunc(expr)) return false;
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

		return true;
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
					this.output += this.makeVarName(varExpr) + " = \"" + expr.createHex() + "\"\"" + expr.value + "\";\n";
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
					this.output += this.varMap[varExpr.type] + varExpr.name + " = \"" + expr.createHex() + "\"\"" + expr.value + "\";\n";
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

		if(exprType === this.exprEnum.NUMBER || 
		   exprType === this.exprEnum.VAR || 
		   exprType === this.exprEnum.BOOL) 
		{
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
		var output = "";

		var params = func.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		var funcName = this.makeFuncName(func);

		// Write head:
		output += this.varMap[func.returnVar.type] + funcName + "(";

		// Write parameters:
		if(numParams) 
		{
			var varDef;
			for(var i = 0; i < numParams; i++) 
			{
				varDef = params[i];
				if(varDef.type === this.varEnum.NUMBER) {
					output += "double " + varDef.name;
				}
				else if(varDef.type === this.varEnum.STRING) {
					output += this.varMap[varDef.type] + varDef.name;
				}
				else {
					console.error("UNRESOLVED_ARGUMENT:", 
						"Function \"" + funcName + "\" has an unresolved argument \"" + varDef.name + "\"");
					return false;
				}

				if(i < numParams - 1) {
					output += ", ";
				}
			}
		}

		output += ") \n{\n";
		this.output += output;
		
		// Write body:
		this.incTabs();
		if(!this.define(func.scope)) { return false; }
		this.decTabs();

		this.output += "}\n";

		return true;
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
		this.outputExpr += this.tabs + varExpr.fullName + " = ";

		var expr = varExpr.expr;
		if(expr.exprType === this.exprEnum.NUMBER) {
			this.outputExpr += expr.value;
		}
		else if(expr.exprType === this.exprEnum.VAR) {
			this.outputExpr += expr.name;
		}		
		else if(expr.exprType === this.exprEnum.STRING) {
			this.outputExpr += "\"" + expr.hexLength + "\"\"" + expr.value + "\"";
		}
		else if(expr.exprType === this.exprEnum.BINARY) {
			this.outputExpr += this._makeVarBinary(varExpr, expr);
		}
		else if(expr.exprType === this.exprEnum.FUNCTION_CALL) {
			console.log("func call");
		}
		else {
			this.outputExpr += expr.value;
		}

		this.outputExpr += ";\n";

		this.outputBuffer = this.outputPre;
		this.outputBuffer += this.outputLength;
		this.outputBuffer += this.outputExpr;
		this.outputBuffer += this.outputPost;
		this.outputScope += this.outputBuffer;
	},	

	_makeVarBinary: function(varExpr, binExpr)
	{
		if(varExpr.type === this.varEnum.STRING) 
		{
			this.outputPost = "";

			this.outputPre = this.tabs + "__dopple_strOffset = NUMBER_SIZE;\n";
			this.outputLength = this.tabs + "__dopple_strLength = ";	

			this.genConcatExpr(varExpr.fullName, binExpr.lhs, false);
			this.genConcatExpr(varExpr.fullName, binExpr.rhs, true);

			this.outputLength += "5;\n";
			this.outputPost += this.tabs + "APPEND_LENGTH(" + varExpr.fullName + ", __dopple_strLength);\n\n";		

			return "malloc(__dopple_strLength + NUMBER_SIZE)";
		}

		var lhsValue;
		if(binExpr.lhs.exprType === this.exprEnum.BINARY) {
			lhsValue = this._makeVarBinary(varExpr, binExpr.lhs);
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
			rhsValue = this._makeVarBinary(varExpr, binExpr.rhs);
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

	genConcatExpr: function(name, expr, last)
	{
		var tmpNum;

		if(expr.exprType === this.exprEnum.BINARY) 
		{
			if(expr.type !== this.varEnum.NUMBER) {
				this.genConcatExpr(name, expr.lhs, false);
				this.genConcatExpr(name, expr.rhs, last);
			}
			else 
			{
				var tmpTotal = this.scopeInfo.addTmpDouble();
				tmpNum = this.scopeInfo.addTmpI32();

				this.outputPre += this.tabs + tmpTotal + " = " + this.emitNumBinaryExpr(expr) + ";\n";
				this.outputPre += this.tabs + tmpNum + " = snprintf(NULL, 0, \"%.17g\", " + tmpTotal + ");\n";
				this.outputPost += this.tabs + "snprintf(" + name + 
					" + __dopple_strOffset, " + tmpNum + " + 1, \"%.17g\", " + tmpTotal + ");\n";
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += " + tmpNum + ";\n";	
				}

				this.outputLength += tmpNum + " + ";
			}
		}
		else if(expr.exprType === this.exprEnum.VAR) 
		{
			if(expr.type === this.varEnum.STRING) 
			{
				this.outputPost += this.tabs + "memcpy(" + name + " + __dopple_strOffset, " + 
					expr.name + " + NUMBER_SIZE, (*(NUMBER *)" + expr.name + "));\n";
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += (*(NUMBER *)" + expr.name + ");\n";
				}

				this.outputLength += "(*(NUMBER *)" + expr.name + ") + ";
			}
			else if(expr.type === this.varEnum.NUMBER)
			{
				tmpNum = this.scopeInfo.addTmpI32();

				this.outputPre += this.tabs + tmpNum + " = snprintf(NULL, 0, \"%.17g\", " + expr.value + ");\n";
				this.outputPost += this.tabs + "snprintf(" + name + 
					" + __dopple_strOffset, " + tmpNum + " + 1, \"%.17g\", " + expr.name + ");\n"	
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += " + tmpNum + ";\n";	
				}

				this.outputLength += tmpNum + " + ";								
			}
			else {
				throw "genConcatExpr: Unhandled expression variable type!";
			}
		}
		else if(expr.exprType === this.exprEnum.STRING) 
		{
			if(!last) 
			{
				this.outputPost += this.tabs + "memcpy(" + name + " + __dopple_strOffset, \"" + 
				 	expr.value + "\", " + expr.length + ");\n"				
				this.outputPost += this.tabs + "__dopple_strOffset += " + expr.length + ";\n";	
			}
			else {
				this.outputPost += this.tabs + "memcpy(" + name + " + __dopple_strOffset, \"" + 
				 	expr.value + "\\0\", " + (expr.length + 1) + ");\n"
			}

			this.outputLength += expr.length + " + ";
		}
		else if(expr.exprType === this.exprEnum.NUMBER)
		{
			tmpNum = this.scopeInfo.addTmpI32();

			var value = expr.value;
			if(Math.floor(value) === value) {
				value += ".0";
			}

			this.outputPre += this.tabs + tmpNum + " = snprintf(NULL, 0, \"%.17g\", " + value + ");\n";
			this.outputPost += this.tabs + "snprintf(" + name + 
				" + __dopple_strOffset, " + tmpNum + " + 1, \"%.17g\", " + value + ");\n";
			if(!last) {
				this.outputPost += this.tabs + "__dopple_strOffset += " + tmpNum + ";\n";	
			}

			this.outputLength += tmpNum + " + ";
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

		this.outputScope += this.tabs + this.makeFuncName(funcCall.func) + "(";

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
					this.outputScope += param.var.defaultValue();
				}
				else {
					this.outputScope += arg.castTo(param);
				}

				for(var i = 1; i < numArgs; i++) 
				{
					this.outputScope += ", ";

					arg = args[i];
					param = params[i];
					if(arg === param) {
						this.outputScope += param.var.defaultValue();
					}
					else {
						this.outputScope += arg.castTo(param);
					}
				}
			}
		}

		this.outputScope += ");\n";
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
				output += "%.17g ";
				argOutput += arg.value + ", ";
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
					output += "%.17g ";
					argOutput += arg.value + ", ";
				}
			}
			else {
				throw "Compiler.makeFormat: Unhandled case.";
			}
		}

		output = output.substr(0, output.length - 1) + "\\n\"";
		argOutput = argOutput.substr(0, argOutput.length - 2);
		this.outputScope += output + ", " + argOutput;
	},

	//
	varMap: {}
});
