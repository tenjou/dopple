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

	emit: function()
	{
		this.output = "";

		var output = this.emitScope(this.global);
		if(output) {
			output += "\n";
		}		

		this.emitFuncs(this.global.funcs);

		this.scopeOutput = "int main(int argc, char *argv[]) \n{\n";
		this.scopeOutput += output;
		this.scopeOutput += "\treturn 0;\n}\n";

		this.libraryOutput = "#include \"dopple.h\"\n\n";
		this.output += this.libraryOutput;
		if(this.defOutput) {
			this.output += this.defOutput + "\n";
		}
		this.output += this.funcOutput;
		this.output += this.scopeOutput;
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

	emitScope: function(scope)
	{
		this.scope = scope;
		this.incTabs();

		var output = "";
		var expr, type;
		var exprs = scope.exprs;
		var numExprs = exprs.length;

		for(var i = 0; i < numExprs; i++)
		{
			expr = exprs[i];
			type = expr.exprType;

			if(type === this.exprEnum.VAR) {
				output += this.emitVar(expr);
			}
			else if(type === this.exprEnum.FUNCTION_CALL) {
				output += this.tabs + this.emitFuncCall(expr) + ";\n";
			}			
			else if(type === this.exprEnum.RETURN) {
				output += this.emitReturn(expr);
			}
		}

		this.decTabs();
		return output;
	},

	emitVar: function(varExpr)
	{
		var output = "";
		var expr = varExpr.expr;
		var exprType = expr.exprType;

		if(varExpr.type === this.varEnum.VOID) {
			console.warn("Unused variable '" + this.makeVarName(varExpr) + "'");
			return output;
		}

		if(!expr) {
			console.error("Unresolved variable '" + this.makeVarName(varExpr) + "'");
			return null;
		}

		if(varExpr.parentList)
		{
			if(exprType === this.exprEnum.VAR) {
				output += this.makeVarName(expr) + expr.value + ";\n";
			}
			else if(exprType === this.exprEnum.STRING) {
				output += this.makeVarName(varExpr) + " = \"" + expr.createHex() + "\"\"" + expr.value + "\";\n";
			}
			else {
				output += this.makeVarName(varExpr) + " = ";
				defineExpr(expr);
				output += ";\n";
			}
		}
		else 
		{
			var defDecl = this.varMap[varExpr.type] + varExpr.value;

			if(exprType === this.exprEnum.BINARY || exprType === this.exprEnum.VAR || exprType === this.exprEnum.FUNCTION_CALL) 
			{
				if(varExpr.isDef && this.scope === this.global) {
					this.defOutput += defDecl + ";\n";
					output += varExpr.value + " = " + this.emitExpr(expr) + ";\n";
				}
				else {
					output += defDecl + " = " + this.emitExpr(expr) + ";\n";
				}
			}
			else 
			{
				if(varExpr.isDef) 
				{
					if(this.scope === this.global) {
						this.defOutput += defDecl + " = " + this.emitExpr(expr) + ";\n";
					}
					else {
						output += defDecl + " = " + this.emitExpr(expr) + ";\n";
					}
				}
				else {
					output += varExpr.value + " = " + this.emitExpr(expr) + ";\n";
				}
			}
		}

		if(output) {
			output = this.tabs + output;
		}

		return output;
	},

	emitExpr: function(expr)
	{
		var exprType = expr.exprType;

		if(exprType === this.exprEnum.NUMBER || 
		   exprType === this.exprEnum.VAR || 
		   exprType === this.exprEnum.BOOL) 
		{
			return expr.value;
		}
		else if(exprType === this.exprEnum.STRING) {
			return "\"" + expr.createHex() + "\"\"" + expr.value + "\"";
		}
		else if(exprType === this.exprEnum.FUNCTION_CALL) {
			return this.emitFuncCall(expr);
		}
		else if(exprType === this.exprEnum.BINARY) {
			var output = this.emitExpr(expr.lhs);
			output += " " + expr.op + " ";
			output += this.emitExpr(expr.rhs);
			return output;
		}
		else {
			console.error("Unhandled expression was caught");
		}

		return null;
	},

	emitFuncs: function(funcs) 
	{
		this.funcOutput = "";

		var output = null;
		var funcs = this.global.funcs;
		var numFuncs = funcs.length;
		for(var i = 0; i < numFuncs; i++) 
		{
			output = this.emitFunc(funcs[i]);
			if(!output) {
				return null;
			}

			this.funcOutput += output + "\n";
		}	

		return this.funcOutput;	
	},	

	emitFunc: function(func)
	{
		if(func.numUses === 0) {
			console.warn("Unused function \'" + func.name + "\'");
			return null;
		}

		var params = func.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		var funcName = this.makeFuncName(func);
		var output = this.varMap[func.type] + funcName + "(";

		if(numParams) 
		{
			var varDef, type;
			for(var i = 0; i < numParams; i++) 
			{
				varDef = params[i];
				type = varDef.type;
				if(type === this.varEnum.NUMBER || type === this.varEnum.STRING || type === this.varEnum.BOOL) {
					output += this.varMap[varDef.type] + varDef.value;
				}
				else {
					console.error("UNRESOLVED_ARGUMENT:", 
						"Function \"" + funcName + "\" has an unresolved argument \"" + varDef.value + "\"");
					return false;
				}

				if(i < numParams - 1) {
					output += ", ";
				}
			}
		}

		output += ") \n{\n";

		var bodyOutput = this.emitScope(func.scope);
		if(!bodyOutput) {
			return null;
		}
		output += bodyOutput + "}\n";

		return output;
	},

	emitReturn: function(returnExpr) 
	{
		var output = this.tabs;

		if(returnExpr.expr) {
			output += "return ";
			output += this.emitExpr(returnExpr.expr.expr);
			output += ";\n";
		}
		else {
			output += "return;\n";
		}

		return output;
	},	

	emitFuncCall: function(funcCall) 
	{
		var i;
		var params = funcCall.func.params;
		var args = funcCall.args;
		var numParams = params.length;
		var numArgs = args.length;

		var output = this.makeFuncName(funcCall.func) + "(";

		// Write arguments:
		for(i = 0; i < numArgs; i++)
		{
			output += args[i].castTo(params[i]);

			if(i < numParams - 1) {
				output += ", ";
			}
		}

		// Write missing parameters:
		for(; i < numParams; i++) 
		{
			output += params[i].var.defaultValue();

			if(i < numParams - 1) {
				output += ", ";
			}			
		}

		output += ")";

		return output;
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

	makeVar: function(varExpr)
	{
		if(varExpr.type === this.varEnum.VOID) {
			console.warn("UNRESOLVED_VARIABLE: Variable \"" + varExpr.name + "\" was discarded because of void type");
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

	makeVarName: function(varExpr)
	{
		var parentList = varExpr.parentList;
		if(!parentList) {
			return varExpr.value;
		}

		var numItems = parentList.length;
		if(numItems <= 0) {
			return varExpr.value;
		}
		
		var name = "";
		for(var i = 0; i < numItems; i++) {
			name += parentList[i].value + ".";
		}
		name += varExpr.value;

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
	varMap: {},

	libraryOutput: "",
	funcOutput: "",
	defOutput: "",
	scopeOutput: ""
});
