"use strict";

Compiler.C = Compiler.Basic.extend
({
	init: function() 
	{
		this.createLexer();

		this.varMap[this.varEnum.VOID] = "void ";
		this.varMap[this.varEnum.NUMBER] = "double ";
		this.varMap[this.varEnum.BOOL] = "int32_t ";
		this.varMap[this.varEnum.I32] = "int32_t ";
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

		var varExpr = new AST.Var("");
		varExpr.expr = new AST.Number(0);
		var returnExpr = new AST.Return(varExpr);
		this.global.exprs.push(returnExpr);
		this.global.returns.push(returnExpr);

		var output = this.emitScope(this.global);
		this.emitFuncs(this.lexer.funcs);

		this.scopeOutput = "int main(int argc, char *argv[]) \n{\n";
		this.scopeOutput += output;
		this.scopeOutput += "}";

		this.libraryOutput = "#include \"dopple.h\"\n\n";
		this.output += this.libraryOutput;
		if(this.global.defOutput) {
			this.output += this.global.defOutput + "\n";
		}
		this.output += this.funcOutput;
		this.output += this.scopeOutput;
	},

	emitScope: function(scope, isVirtual)
	{
		var prevScope = this.scope;
		this.scope = scope;
		this.incTabs();

		var i, item, items, numItems;
		var output = "";
		var tmpOutput = "";
		var tabs = "";

		if(scope !== this.global) {
			tabs = this.tabs;
		}

		// Emit expressions:
		var expr, type;
		var exprs = scope.exprs;
		var numExprs = exprs.length;
		for(i = 0; i < numExprs; i++)
		{
			expr = exprs[i];
			type = expr.exprType;

			if(type === this.exprEnum.VAR) 
			{
				tmpOutput = this.emitVar(expr);
				if(tmpOutput) {
					output += this.outputPre;
					output += this.outputLength;
					output += this.tabs + tmpOutput + ";\n";
					output += this.outputPost;
				}
			}
			else if(type === this.exprEnum.IF) {
				output += this.emitIf(expr);
			}
			else if(type === this.exprEnum.FOR) {
				output += this.emitFor(expr);
			}
			else if(type === this.exprEnum.FUNCTION_CALL) {
				output += this.tabs + this.emitFuncCall(expr) + ";\n";
			}	
			else if(type === this.exprEnum.UNARY) {
				output += this.tabs + this.emitExpr(expr) + ";\n";
			}		
			else if(type === this.exprEnum.RETURN) {
				output += this.emitReturn(expr);
			}
		}

		if(!isVirtual)
		{
			var defOutput = "";

			// Emit variable groups:
			var group;
			for(var key in scope.varGroup)
			{
				defOutput += tabs + this.varMap[key];

				group = scope.varGroup[key];
				numItems = group.length;

				if(key === this.varEnum.STRING) 
				{
					for(i = 0; i < numItems; i++) 
					{
						item = group[i];
						
						defOutput += item.value;
						if(i < numItems - 1) {
							defOutput += ", *";
						}
						else {
							defOutput += ";\n";
						}
					}
				}
				else
				{
					for(i = 0; i < numItems; i++) 
					{
						item = group[i];
						
						defOutput += item.value;
						if(i < numItems - 1) {
							defOutput += ", ";
						}
						else {
							defOutput += ";\n";
						}
					}
				}
			}	

			if(defOutput) {
				this.scope.defOutput = defOutput;
			}
		}

		if(this.scope.defOutput && this.scope !== this.global) {
			output = this.scope.defOutput + "\n" + output;
		}
		
		this.decTabs();

		this.scope = prevScope;

		return output;
	},

	emitVar: function(varExpr)
	{
		var output = "";
		var varType = varExpr.var.type;

		var expr = varExpr.expr;
		if(!expr) {
			console.error("Unresolved variable '" + dopple.makeVarName(varExpr) + "'");
			return null;
		}

		var exprType = expr.exprType;
		var strOp = " " + varExpr.op + " ";
		varExpr.fullName = dopple.makeVarName(varExpr);

		if(varExpr.parentList)
		{
			if(exprType === this.exprEnum.VAR) {
				output += varExpr.fullName + expr.value + ";\n";
			}
			else if(exprType === this.exprEnum.STRING) {
				output += varExpr.fullName + strOp + "\"" + expr.createHex() + "\"\"" + expr.value + "\"";
			}
			else {
				output += varExpr.fullName + strOp;
				defineExpr(expr);
				output += ";\n";
			}
		}
		else {
			output += varExpr.value + strOp + this.emitExpr(expr, varExpr);
		}

		return output;
	},

	emitExpr: function(expr, varExpr)
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
		else if(exprType === this.exprEnum.BINARY) 
		{
			var output;

			if(expr.type === this.varEnum.STRING)
			{
				var name;
				if(varExpr) {
					name = varExpr.fullName;
					output = "malloc(__dopple_strLength + NUMBER_SIZE)";
				}
				else {
					varExpr = this.scope.addTmpString();
					name = varExpr.value;
					output = name;
					this.outputPost = this.tabs + name + " = malloc(__dopple_strLength + NUMBER_SIZE);\n";
				}	

				this.outputPre = this.tabs + "__dopple_strOffset = NUMBER_SIZE;\n";
				this.outputLength = this.tabs + "__dopple_strLength = ";

				this.emitConcatExpr(name, expr.lhs, false);
				this.emitConcatExpr(name, expr.rhs, true);

				this.outputLength += "5;\n";
				this.outputPost += this.tabs + "APPEND_LENGTH(" + name + ", __dopple_strLength);\n";		

				return output;
			}
			else
			{
				output = this.emitExpr(expr.lhs, null);
				output += " " + expr.op + " ";
				output += this.emitExpr(expr.rhs, null);
				return output;
			}	
		}
		else if(exprType === this.exprEnum.UNARY) 
		{
			if(expr.pre) {
				return expr.op + expr.varExpr.value;
			}
			else {
				return expr.varExpr.value + expr.op;
			}
		}
		else {
			console.error("Unhandled expression was caught");
		}

		return null;
	},

	emitIf: function(ifExpr)
	{
		var output = "";
		var tmpOutput = "";

		var branch;
		var branches = ifExpr.branches;
		var numBranches = branches.length;
		for(var i = 0; i < numBranches; i++)
		{
			branch = branches[i];

			if(branch.type === "if" || branch.type === "else if") 
			{
				tmpOutput += this.tabs + branch.type + "(";
				tmpOutput += this.emitExpr(branch.expr);
				tmpOutput += ")\n";	

				output = this.outputPre;
				output += this.outputLength;
				output += this.outputPost;
				output += tmpOutput;								
			}
			else {
				output += this.tabs + "else\n";
			}

			output += this.tabs + "{\n";
			output += this.emitScope(branch.scope, true);
			output += this.tabs + "}\n";			
		}

		return output;
	},

	emitFor: function(forExpr)
	{
		var output = this.tabs + "for("; 
		
		if(forExpr.initExpr) {
			output += this.emitVar(forExpr.initExpr);
		}
		output += ";";
		
		if(forExpr.cmpExpr) {
			output += " " + this.emitExpr(forExpr.cmpExpr);
		}
		output += ";";	

		if(forExpr.iterExpr) {
			output += " " + this.emitExpr(forExpr.iterExpr);
		}		

		output += ") \n";
		output += this.tabs + "{\n";
		output += this.emitScope(forExpr.scope, true);
		output += this.tabs + "}\n";

		return output;
	},

	emitFuncs: function(funcs) 
	{
		this.funcOutput = "";

		var output = null;
		var numFuncs = this.funcs.length;
		for(var i = 0; i < numFuncs; i++) 
		{
			output = this.emitFunc(this.funcs[i]);
			if(this.error) { return null; }

			if(output) {
				this.funcOutput += output + "\n";
			}
		}	

		return this.funcOutput;	
	},	

	emitFunc: function(func)
	{
		if(this.stripDeadCode && func.numUses === 0) {
			console.warn("Unused function \'" + func.name + "\'");
			return null;
		}

		var params = func.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		var funcName = dopple.makeFuncName(func);
		var output = this.varMap[func.type] + funcName + "(";

		if(numParams) 
		{
			var varDef, type;
			for(var i = 0; i < numParams; i++) 
			{
				varDef = params[i];
				type = varDef.type;
				if(type === this.varEnum.NUMBER || 
				   type === this.varEnum.STRING || 
				   type === this.varEnum.BOOL) 
				{
					output += this.varMap[varDef.type] + varDef.value;
				}
				else {
					console.error("(Unresolved Argument)", 
						"Function \"" + funcName + "\" has an unresolved argument \"" + varDef.value + "\"");
					this.error = true;
					return null;
				}

				if(i < numParams - 1) {
					output += ", ";
				}
			}
		}

		output += ") \n{\n";
		output += this.emitScope(func.scope) + "}\n";

		return output;
	},

	emitReturn: function(returnExpr) 
	{
		var output;

		if(returnExpr.expr)
		{
			var tmpOutput = this.tabs + "return " + this.emitExpr(returnExpr.expr.expr, null) + ";\n";
			output = this.outputPre;
			output += this.outputLength;
			output += this.outputPost;
			output += tmpOutput;
		}
		else {
			output = this.tabs + "return;\n";
		}

		return output;
	},	

	emitFuncCall: function(funcCall) 
	{
		var i, param;
		var params = funcCall.func.params;
		var args = funcCall.args;
		var numParams = params.length;
		var numArgs = args.length;

		var output = dopple.makeFuncName(funcCall.func) + "(";

		// Write arguments:
		for(i = 0; i < numArgs; i++)
		{
			param = params[i];
			if(param.type === this.varEnum.FORMAT) {
				output += this.emitFormat(args, i);
				output += ")";
				return output;
			}
			else {
				output += args[i].castTo(param);
			}

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

		varExpr.fullName = dopple.makeVarName(varExpr);
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

	emitConcatExpr: function(name, expr, last)
	{
		var tmpVarNum;

		if(expr.exprType === this.exprEnum.BINARY) 
		{
			if(expr.type !== this.varEnum.NUMBER) {
				this.emitConcatExpr(name, expr.lhs, false);
				this.emitConcatExpr(name, expr.rhs, last);
			}
			else 
			{
				var tmpVarTotal = this.scope.addTmpDouble();
				tmpVarNum = this.scope.addTmpI32();

				this.outputPre += this.tabs + tmpVarTotal.value + " = " + this.emitNumBinaryExpr(expr) + ";\n";
				this.outputPre += this.tabs + tmpVarNum.value + " = snprintf(NULL, 0, \"%.16g\", " + tmpVarTotal.value + ");\n";
				this.outputPost += this.tabs + "snprintf(" + name + 
					" + __dopple_strOffset, " + tmpVarNum.value + " + 1, \"%.16g\", " + tmpVarTotal.value + ");\n";
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += " + tmpVarNum.value + ";\n";	
				}

				this.outputLength += tmpVarNum.value + " + ";
			}
		}
		else if(expr.exprType === this.exprEnum.VAR) 
		{
			if(expr.type === this.varEnum.STRING) 
			{
				this.outputPost += this.tabs + "memcpy(" + name + " + __dopple_strOffset, " + 
					expr.value + " + NUMBER_SIZE, (*(NUMBER *)" + expr.value + "));\n";
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += (*(NUMBER *)" + expr.value + ");\n";
				}

				this.outputLength += "(*(NUMBER *)" + expr.value + ") + ";
			}
			else if(expr.type === this.varEnum.NUMBER)
			{
				tmpVarNum = this.scope.addTmpI32();

				this.outputPre += this.tabs + tmpVarNum.value + " = snprintf(NULL, 0, \"%.16g\", " + expr.value + ");\n";
				this.outputPost += this.tabs + "snprintf(" + name + 
					" + __dopple_strOffset, " + tmpVarNum.value + " + 1, \"%.16g\", " + expr.value + ");\n"	
				if(!last) {
					this.outputPost += this.tabs + "__dopple_strOffset += " + tmpVarNum.value + ";\n";	
				}

				this.outputLength += tmpVarNum.value + " + ";								
			}
			else {
				console.error("(emitConcatExpr): Unhandled expression type!");
				return false;
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
			tmpVarNum = this.scope.addTmpI32();

			var value = expr.value;
			if(Math.floor(value) === value) {
				value += ".0";
			}

			this.outputPre += this.tabs + tmpVarNum.value + " = snprintf(NULL, 0, \"%.17g\", " + value + ");\n";
			this.outputPost += this.tabs + "snprintf(" + name + 
				" + __dopple_strOffset, " + tmpVarNum.value + " + 1, \"%.17g\", " + value + ");\n";
			if(!last) {
				this.outputPost += this.tabs + "__dopple_strOffset += " + tmpVarNum.value + ";\n";	
			}

			this.outputLength += tmpVarNum.value + " + ";
		}
		else {
			console.error("(emitConcatExpr): Unhandled expression type!");
			return false;
		}		

		return true;
	},

	emitFormat: function(args)
	{
		this.tmpOutput1 = "";
		this.tmpOutput2 = "";

		var exprType, varType, arg;
		var numArgs = args.length;
		for(var i = 0; i < numArgs; i++) 
		{
			arg = args[i];
			exprType = arg.exprType;
			if(exprType === this.exprEnum.BINARY) 
			{
				if(arg.type === this.varEnum.STRING) {
					this.tmpOutput1 += "%s ";
				}
				else {
					this.tmpOutput1 += "%.17g ";
				}	

				this.emitBinaryArg(arg);
			}			
			else if(exprType === this.exprEnum.NUMBER) {
				this.tmpOutput1 += "%.17g ";
				this.tmpOutput2 += arg.value + ", ";
			}
			else if(exprType === this.exprEnum.STRING) {
				this.tmpOutput1 += "%s ";
				this.tmpOutput2 += "\"" + arg.value + "\"" + ", ";
			}
			else if(exprType === this.exprEnum.VAR) 
			{
				varType = arg.type;
				if(varType === this.varEnum.STRING) {
					this.tmpOutput1 += "%s ";
					this.tmpOutput2 += arg.value + " + NUMBER_SIZE, ";
				}
				else {
					this.tmpOutput1 += "%.17g ";
					this.tmpOutput2 += arg.value + ", ";
				}
			}
			else if(exprType === this.exprEnum.UNARY) 
			{
				this.tmpOutput1 += "%.17g ";
				if(arg.pre) {
					this.tmpOutput2 += arg.op + arg.varExpr.value + ", ";
				}
				else {
					this.tmpOutput2 += arg.varExpr.value + arg.op + ", ";
				}
			}			
			else {
				console.error("Compiler.emitFormat: An unhandled case.");
				return false;
			}
		}

		this.tmpOutput1 = "\"" + this.tmpOutput1.substr(0, this.tmpOutput1.length - 1) + "\\n\"";
		this.tmpOutput2 = this.tmpOutput2.substr(0, this.tmpOutput2.length - 2);
		return this.tmpOutput1 + ", " + this.tmpOutput2;
	},

	emitBinaryArg: function(arg)
	{
		var exprType = arg.exprType;
		if(exprType === this.exprEnum.BINARY) 
		{
			if(!this.emitBinaryArg(arg.lhs)) {
				return false;
			}

			this.tmpOutput2 += arg.op + " ";
			
			if(!this.emitBinaryArg(arg.rhs)) {
				return false;
			}

			this.tmpOutput2 += ","
		}		
		else if(exprType === this.exprEnum.NUMBER) {
			this.tmpOutput2 += arg.value + " ";
		}
		else if(exprType === this.exprEnum.STRING) {
			this.tmpOutput2 += "\"" + arg.value + "\"" + " ";
		}
		else if(exprType === this.exprEnum.VAR) 
		{
			var varType = arg.type;
			if(varType === this.varEnum.STRING) {
				this.tmpOutput2 += arg.value + " + NUMBER_SIZE ";
			}
			else {
				this.tmpOutput2 += arg.value + " ";
			}			
		}
		else if(exprType === this.exprEnum.UNARY) 
		{
			if(arg.pre) {
				this.tmpOutput2 += arg.op + arg.varExpr.value + " ";
			}
			else {
				this.tmpOutput2 += arg.varExpr.value + arg.op + " ";
			}
		}
		else {
			console.error("Compiler.emitFormat: An unhandled case.");
			return false;
		}			

		return true;
	},

	//
	varMap: {},

	libraryOutput: "",
	funcOutput: "",
	scopeOutput: "",

	tmpOutput1: "",
	tmpOutput2: ""
});
