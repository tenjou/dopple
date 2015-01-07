"use strict";

Compiler.C = Compiler.Basic.extend
({
	load: function()
	{
		this.varMap[this.varEnum.VOID] = "void ";
		this.varMap[this.varEnum.NUMBER] = "double ";
		this.varMap[this.varEnum.BOOL] = "int32_t ";
		this.varMap[this.varEnum.I32] = "int32_t ";
		this.varMap[this.varEnum.NAME] = "const char *";
		this.varMap[this.varEnum.STRING] = "char *";

		this.createLexer();
	},

	createLexer: function()
	{
		var extern = this.lexer.extern;

		extern.func("confirm", [ this.varEnum.STRING ]);
		extern.func("prompt", [ this.varEnum.STRING ], this.varEnum.STRING);
		
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

		var i, n, item, items, numItems;
		var output = "";
		var tmpOutput = "";
		var tabs = "";

		if(scope !== this.global) 
		{
			tabs = this.tabs;

			this.haveNewline = scope.varGroup ? true : false;
		}
		else if(scope.objs)
		{
			var prevTabs = this.tabs;
			this.tabs = "";

			var objs = scope.objs;
			var numItems = objs.length;
			for(i = 0; i < numItems; i++) {
				this.global.defOutput += this.emitCls(objs[i]);
			}

			this.tabs = prevTabs;
		}

		this.emitFuncs(scope.funcs);

		this.newNewline = false;

		// Emit expressions:
		var expr, type;
		var exprs = scope.exprs;
		var numExprs = exprs.length;
		for(i = 0; i < numExprs; i++)
		{
			expr = exprs[i];
			type = expr.exprType;

			if(type === this.exprEnum.VAR) {
				tmpOutput = this.tabs + this.emitVar(expr) + ";\n";
			}
			else if(type === this.exprEnum.IF) {
				tmpOutput = this.emitIf(expr);
			}
			else if(type === this.exprEnum.FOR) {
				tmpOutput = this.emitFor(expr);
			}
			else if(type === this.exprEnum.FUNCTION_CALL) {
				tmpOutput = this.tabs + this.emitFuncCall(expr) + ";\n";
			}	
			else if(type === this.exprEnum.UNARY) {
				tmpOutput = this.tabs + this.emitExpr(expr) + ";\n";
			}		
			else if(type === this.exprEnum.RETURN) {
				tmpOutput = this.emitReturn(expr);
			}

			numItems = this.genBuffer.length;
			if(numItems > 0) 
			{
				for(n = 0; n < numItems; n++) {
					item = this.genBuffer[n];
					output += item.pre;
					output += item.length;
					output += item.post;
				}

				this.genBuffer.length = 0;
			}
			output += tmpOutput;

			this.haveNewline = false;
			if(this.newNewline) {
				this.haveNewline = true;
				this.newNewline = false;
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
				type = parseInt(key);

				if(type === this.varEnum.STRING) 
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
				else if(type > 99)
				{
					defOutput += " *";

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

			if(defOutput) 
			{
				if(this.scope.defOutput) {
					this.scope.defOutput += "\n" + defOutput;
				}
				else {
					this.scope.defOutput = defOutput;
				}
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
		if(this.settings.stripDeadCode && varExpr.var.numUses === 0) {
			return null;
		}

		var output = "";
		var varType = varExpr.var.type;

		var expr = varExpr.expr;
		if(!expr) {
			console.error("Unresolved variable '" + dopple.makeVarName(varExpr) + "'");
			return null;
		}

		var exprType = expr.exprType;

		var strOp;
		if(varExpr.op) {
			strOp = " " + varExpr.op + " ";
		}
		else {
			strOp = " = ";
		}

		varExpr.fullName = dopple.makeVarName(varExpr);

		if(varExpr.parentList)
		{
			if(exprType === this.exprEnum.VAR) {
				output += varExpr.fullName + expr.fullName;
			}
			else if(exprType === this.exprEnum.STRING) {
				output += varExpr.fullName + strOp + "\"" + expr.createHex() + "\"\"" + expr.value + "\"";
			}
			else {
				output += varExpr.fullName + strOp;
				output += this.emitExpr(expr);
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

		if(exprType === this.exprEnum.VAR) 
		{
			if(expr.fullName) {
				return expr.fullName;
			}
			return dopple.makeVarName(expr);
		}
		else if(exprType === this.exprEnum.NUMBER ||  
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
				varExpr = this.scope.addTmpString(false);
				var name = varExpr.value;
				var outputGen = new this.OutputGen();

				if(!this.haveNewline) {
					outputGen.pre = "\n";
				}

				this.haveNewline = false;
				this.newNewline = true;
				
				outputGen.length = this.tabs + "__dopple_strLength = ";

				outputGen.post = this.tabs + "STR_APPEND_START();\n";
				outputGen.post += this.tabs + "STR_MALLOC(" + name + ");\n";

				this._emitConcatExpr(name, expr.lhs, false, outputGen);
				this._emitConcatExpr(name, expr.rhs, true, outputGen);

				outputGen.length += "5;\n";
				outputGen.post += this.tabs + "STR_APPEND_END(" + name + ");\n\n";	
			
				this.genBuffer.push(outputGen);
				this.global.endTmpBlock();

				return name;
			}
			else
			{
				output = this.emitExpr(expr.lhs, null);
				output += " " + expr.op + " ";
				output += this.emitExpr(expr.rhs, null);
				return output;
			}	
		}
		else if(exprType === this.exprEnum.ALLOC) 
		{
			if(varExpr) 
			{
				output = "MALLOC_CLS(" + expr.cls.name + ");\n";
				output += this.tabs + this.emitFuncCall(expr.constrCall, varExpr.value);
				if(this.error) { return null; }	
			}			
			
			return output;
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

	_emitConcatExpr: function(name, expr, last, outputGen)
	{
		var tmpVarNum;
		var exprType = expr.exprType;

		if(exprType === this.exprEnum.BINARY) 
		{
			if(expr.type !== this.varEnum.NUMBER) {
				this._emitConcatExpr(name, expr.lhs, false, outputGen);
				this._emitConcatExpr(name, expr.rhs, last, outputGen);
			}
			else 
			{
				var tmpVarTotal = this.global.addTmpDouble(true);
				tmpVarNum = this.global.addTmpI32(true);

				outputGen.pre += this.tabs + tmpVarTotal.value + " = " + this.emitNumBinaryExpr(expr) + ";\n";
				outputGen.pre += this.tabs + tmpVarNum.value + " = STR_NUMBER_LENGTH(" + tmpVarTotal.value + ");\n";
				outputGen.post += this.tabs + "STR_APPEND_NUM(" + name + ", " + tmpVarNum.value + ", " + tmpVarTotal.value + ");\n";
				if(!last) {
					outputGen.post += this.tabs + "STR_INC_NUM_OFFSET(" + tmpVarNum.value + ");\n";	
				}

				outputGen.length += tmpVarNum.value + " + ";
			}
		}
		else if(exprType === this.exprEnum.VAR || exprType === this.exprEnum.FUNCTION_CALL) {
			return this._emitConcatExpr_var(name, expr, last, outputGen);
		}
		else if(exprType === this.exprEnum.STRING) 
		{
			if(!last) 
			{
				outputGen.post += this.tabs + "STR_APPEND_STR(" + name + ", \"" + expr.value + "\", " + expr.length + ");\n"				
				outputGen.post += this.tabs + "STR_INC_NUM_OFFSET(" + expr.length + ");\n";	
			}
			else 
			{
				outputGen.post += this.tabs + "STR_APPEND_MEMCPY_ZERO(" + name + ", \"" + 
					(expr.value + "\\0") + "\", " + (expr.length + 1) + ");\n";
			}

			outputGen.length += expr.length + " + ";
		}
		else if(exprType === this.exprEnum.NUMBER)
		{
			tmpVarNum = this.global.addTmpI32(true);

			var value = expr.value;
			if(Math.floor(value) === value) {
				value += ".0";
			}

			outputGen.pre += this.tabs + tmpVarNum.value + " = STR_NUM_LEN(" + value + ");\n";
			outputGen.post += this.tabs + "STR_APPEND_NUM(" + name + ", " + tmpVarNum.value + ", " + value + ");\n";
			if(!last) {
				outputGen.post += this.tabs + "STR_INC_NUM_OFFSET(" + tmpVarNum.value + ");\n";	
			}

			outputGen.length += tmpVarNum.value + " + ";
		}
		else {
			console.error("(_emitConcatExpr): Unhandled expression type!");
			return false;
		}		

		return true;
	},

	_emitConcatExpr_var: function(name, expr, last, outputGen)
	{
		var value;

		if(expr.exprType === this.exprEnum.FUNCTION_CALL) 
		{
			var funcOutput = this.emitFuncCall(expr);

			expr = this.scope.addTmp(expr.func.type, false);
			value = expr.value;

			outputGen.pre += this.tabs + value + " = " + funcOutput + ";\n";
		}
		else {
			value = dopple.makeVarName(expr);
		}

		if(expr.type === this.varEnum.STRING) 
		{
			outputGen.post += this.tabs + "STR_APPEND_MEMCPY(" + name + ", " + value + ");\n";
			if(!last) {
				outputGen.post += this.tabs + "STR_INC_STR_OFFSET(" + value + ");\n";
			}

			outputGen.length += "(*(NUMBER *)" + value + ") + ";
		}
		else if(expr.type === this.varEnum.NUMBER)
		{
			var tmpVarNum = this.global.addTmpI32(true);

			outputGen.pre += this.tabs + tmpVarNum.value + " = STR_NUM_LEN(" + value + ");\n";
			outputGen.post += this.tabs + "STR_APPEND_NUM(" + name + ", " + tmpVarNum.value + ", " + value + ");\n"	
			if(!last) {
				outputGen.post += this.tabs + "STR_INC_NUM_OFFSET(" + tmpVarNum.value + ");\n";	
			}

			outputGen.length += tmpVarNum.value + " + ";								
		}
		else {
			console.error("(_emitConcatExpr) Unhandled expression type!");
			return false;
		}

		return true;
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
				output += this.tabs + branch.type + "(";
				output += this.emitExpr(branch.expr);
				output += ")\n";								
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
		var numFuncs = funcs.length;
		for(var i = 0; i < numFuncs; i++) 
		{
			output = this.emitFunc(funcs[i]);
			if(this.error) { return null; }

			if(output) {
				this.funcOutput += output + "\n";
			}
		}	

		return this.funcOutput;	
	},	

	emitFunc: function(func)
	{
		if(this.settings.stripDeadCode && func.numUses === 0) {
			return null;
		}

		var params = func.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		var funcName = dopple.makeFuncName(func);
		var output = this.varMap[func.type] + funcName + "(";

		var obj = func.obj;
		if(obj) {
			output += this.varMap[obj.type] + " *this";
		}

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
				else 
				{
					var line = "(" + this.lexer.fileName + ":" + varDef.line + ") ";
					console.error(line + "(Unresolved Argument)", 
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
	
		// If is constructor - initialize class variables:
		if(func.obj && func.obj.isStatic) {
			output += this.emitConstrFunc(func.obj);
		}
		else {
			output += this.emitScope(func.scope);
		}

		output += "}\n";

		return output;
	},

	emitConstrFunc: function(obj)
	{
		var output = "";

		var varExpr;
		var vars = obj.scope.vars;
		for(var key in vars) 
		{
			varExpr = vars[key];
			if(varExpr.exprType === this.exprEnum.VAR) {
				output += this.tabs + this.emitVar(varExpr) + ";\n";
			}
		}

		return output;
	},

	emitReturn: function(returnExpr) 
	{
		var output;

		if(returnExpr.expr) {
			output = this.tabs + "return " + this.emitExpr(returnExpr.expr.expr, null) + ";\n";
		}
		else {
			output = this.tabs + "return;\n";
		}

		return output;
	},	

	emitFuncCall: function(funcCall, thisVar) 
	{
		var i, arg, param;
		var params = funcCall.func.params;
		var args = funcCall.args;

		var numParams = params ? params.length : 0;
		var numArgs = args ? args.length : 0;

		var output = dopple.makeFuncName(funcCall.func) + "(";

		if(thisVar) 
		{
			if(numParams === 0) {
				output += thisVar;
			}
			else {
				output += thisVar + ", ";
			}
		}

		// Write arguments:
		for(i = 0; i < numArgs; i++)
		{
			param = params[i];
			if(param.type === this.varEnum.FORMAT) {
				output += this.emitFormat(args, i);
				output += ")";
				return output;
			}
			else 
			{
				arg = args[i];
				if(arg.exprType === this.exprEnum.BINARY) {
					output += this.emitExpr(arg);			
				}
				else {
					output += arg.castTo(param);
				}
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

	emitCls: function(clsExpr)
	{
		var output;

		if(clsExpr.isStatic) {
			output = "static";
		}
		else {
			output = "typedef";
		}

		output += " struct {";

		var varExpr;
		var vars = clsExpr.scope.vars;
		for(var key in vars) 
		{
			varExpr = vars[key];
			if(varExpr.exprType !== this.exprEnum.VAR) { continue; }

			output += "\n" + this.tabs + this.varMap[varExpr.type] + key + ";";
		}

		output += "\n} " + clsExpr.name + ";\n\n";

		output += this.emitFunc(clsExpr.constrFunc);
		if(this.error) { return null; }				

		return output;
	},

	emitFormat: function(args)
	{
		this.tmpOutput1 = "";
		this.tmpOutput2 = "";

		var exprType, varType, arg, name, value;
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
			else if(exprType === this.exprEnum.NUMBER) 
			{
				value = arg.value;
				if(Math.floor(value) === value) {
					value += ".0";
				}

				this.tmpOutput1 += "%.17g ";
				this.tmpOutput2 += value + ", ";
			}
			else if(exprType === this.exprEnum.STRING) {
				this.tmpOutput1 += "%s ";
				this.tmpOutput2 += "\"" + arg.value + "\"" + ", ";
			}
			else if(exprType === this.exprEnum.VAR) 
			{
				name = dopple.makeVarName(arg);
				varType = arg.type;

				if(varType === this.varEnum.STRING) {
					this.tmpOutput1 += "%s ";
					this.tmpOutput2 += name + " + NUMBER_SIZE, ";
				}
				else {
					this.tmpOutput1 += "%.17g ";
					this.tmpOutput2 += name + ", ";
				}
			}
			else if(exprType === this.exprEnum.FUNCTION_CALL) 
			{
				var funcCallOutput = this.emitFuncCall(arg);
				varType = arg.func.type;

				if(varType === this.varEnum.STRING) {
					this.tmpOutput1 += "%s ";
					this.tmpOutput2 += funcCallOutput + " + NUMBER_SIZE, ";
				}
				else {
					this.tmpOutput1 += "%.17g ";
					this.tmpOutput2 += funcCallOutput + ", ";
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
				console.error("(Compiler.emitFormat) An unhandled case.");
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
	tmpOutput2: "",

	haveNewline: false,
	newNewline: false
});
