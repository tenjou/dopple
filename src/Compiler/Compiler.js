"use strict";

function Compiler()
{
	this.lexer = null;
	this.createLexer();

	this.varMap = {};
	this.varMap[Variable.Type.VOID] = "void ";
	this.varMap[Variable.Type.NUMBER] = "double ";
	this.varMap[Variable.Type.BOOL] = "int32_t ";
	this.varMap[Variable.Type.STRING] = "const char *";
	this.varMap[Variable.Type.STRING_OBJ] = "char *";

	this.tabs = "";
	this.output = "";

	this.global = this.lexer.global;
	this.scope = null;

	this.exprEnum = Expression.Type;
	this.varEnum = Variable.Type;
};

Compiler.prototype = 
{
	createLexer: function()
	{
		this.lexer = new Lexer();
		
		//var console = this.lexer.externObj("console");
		// console.externFunc("log", [ Variable.Type.FORMAT, "format", Variable.Type.ARGS, "..."]);

		this.lexer.externFunc("alert", [ Variable.Type.STRING_OBJ, "str" ]);
		this.lexer.externFunc("confirm", [ Variable.Type.STRING_OBJ, "str" ]);
	},

	compile: function(str)
	{
		if(this.lexer.read(str)) 
		{
//			try {
				return this.make();
			// }
			// catch(str) {
			// 	console.error(str);
			// }
		}

		return "";	
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
			var exprEnum = Expression.Type;

			for(i = 0; i < numExpr; i++)
			{
				expr = varBuffer[i];
				exprType = expr.exprType;

				if(exprType === exprEnum.VAR) {
					this.makeVar(expr);
				}
				else if(exprType === exprEnum.FUNCTION) {
					this.output += this.tabs + this.makeFunction(expr);
				}
				else if(exprType === exprEnum.FUNCTION_CALL) {
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
	},


	defineVar: function(varExpr)
	{
		if(varExpr.type === Variable.Type.VOID) {
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
				else if(exprType === this.exprEnum.STRING_OBJ) {
					this.output += this.makeVarName(varExpr) + " = \"" + expr.length + "\"\"" + expr.value + "\";\n";
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
				else if(exprType === this.exprEnum.STRING_OBJ) {
					this.output += this.varMap[varExpr.type] + varExpr.name + " = \"" + expr.length + "\"\"" + expr.value + "\";\n";
				}
				else 
				{
					if(this.scope === this.global && varExpr.expr.exprType === Expression.Type.BINARY) {
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
		var exprEnum = Expression.Type;

		if(exprType === exprEnum.NUMBER || exprType === exprEnum.VAR) {
			this.output += expr.value;
		}
		else if(exprType === exprEnum.BINARY) {
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
		this.output += this.varMap[func.returnVar.type] + func.name + "(";

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
		if(varExpr.type === Variable.Type.VOID) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - void type.");
			return "";
		}

		this.output += this.tabs + this.makeVarName(varExpr) + " = ";

		var exprType = Expression.Type;
		var expr = varExpr.expr;
		if(expr.exprType === exprType.NUMBER) {
			this.output += expr.value;
		}
		else if(expr.exprType === exprType.VAR) {
			this.output += expr.name;
		}		
		else if(expr.exprType === exprType.STRING_OBJ) {
			this.output += "\"" + expr.length + "\"\"" + expr.value + "\"";
		}
		else if(expr.exprType === exprType.BINARY) {
			this.output += this._makeVarBinary(expr);
		}
		else {
			this.output += expr.value;
		}

		this.output += ";\n";
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

	makeVarExpr: function(varExpr)
	{
		if(varExpr.type === Variable.Type.VOID) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - void type.");
			return "";
		}

		var exprType = Expression.Type;
		var output = varExpr.name + " = ";

		var expr = varExpr.expr;
		if(expr.exprType === exprType.NUMBER) {
			output += expr.value + ";\n";
		}
		else if(expr.exprType === exprType.VAR) {
			output += expr.value + ";\n";
		}
		else if(expr.exprType === exprType.STRING_OBJ) {
			output += "\"" + expr.value + "\";\n";
		}
		else if(expr.exprType === exprType.BINARY) {
			output += this._makeVarBinary(expr) + ";\n";
		}

		return output;
	},	

	_makeVarBinary: function(binExpr)
	{
		var lhsValue;
		if(binExpr.lhs.exprType === Expression.Type.BINARY) {
			lhsValue = this._makeVarBinary(binExpr.lhs);
		}
		else 
		{
			if(binExpr.lhs.type === Variable.Type.STRING_OBJ) {
				lhsValue = "\"" + binExpr.lhs.str + "\"";
			}
			else {
				lhsValue = binExpr.lhs.value;
			}
		}

		var rhsValue;
		if(binExpr.rhs.exprType === Expression.Type.BINARY) {
			rhsValue = this._makeVarBinary(binExpr.rhs);
		}
		else 
		{
			if(binExpr.rhs.type === Variable.Type.STRING) {
				rhsValue = "\"" + binExpr.rhs.str + "\"";
			}
			else {
				rhsValue = binExpr.rhs.value;
			}
		}

		return lhsValue + " " + binExpr.op + " " + rhsValue;
	},	

	makeFuncCall: function(funcCall) 
	{
		var params = funcCall.func.params;
		var args = funcCall.args;
		var numArgs = funcCall.func.numParams;

		this.output += this.tabs + funcCall.func.name + "(";

		// Write arguments, if there is any:
		if(numArgs > 0)
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

		this.output += ");\n";
	},	


	incTabs: function() {
		this.tabs += "\t";
	},

	decTabs: function() {
		this.tabs = this.tabs.substr(0, this.tabs.length - 1);
	}
};

