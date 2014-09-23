"use strict";

function Compiler(library)
{
	this.lexer = null;
	this.createLexer();

	this.varMap = {};
	this.varMap[Variable.Type.UNKNOWN] = "void";
	this.varMap[Variable.Type.NUMBER] = "double";
	this.varMap[Variable.Type.BOOL] = "int32_t";

	this.library = library || "";
	this.tabs = "";
	this.output = "";

	this.global = this.lexer.global;
	this.scope = null;
};

Compiler.prototype = 
{
	createLexer: function()
	{
		this.lexer = new Lexer();
		
		// var console = this.lexer.externScope("console");
		// console.externFunc("log", [ Variable.Type.FORMAT, "format", Variable.Type.ARGS, "..."]);

		this.lexer.externFunc("alert", [ Variable.Type.STRING, "str" ]);
		this.lexer.externFunc("confirm", [ Variable.Type.STRING, "str" ]);
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
		this.output = this.library + "\n\n";

		this.define(this.global);

		// Main start.
		this.output += "int main(int argc, char *argv[]) \n{\n";
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
		var exprEnum = Expression.Type;

		var defs = scope.defBuffer;
		var numDefs = defs.length;
		if(numDefs)
		{
			for(i = 0; i < numDefs; i++) 
			{
				expr = defs[i];
				exprType = expr.exprType;

				if(exprType === exprEnum.VAR) {
					this.defineVar(expr);
				}
				else if(exprType === exprEnum.FUNCTION) {
					this.defineFunc(expr);
				}
				else if(exprType === exprEnum.FUNCTION_CALL) {
					this.defineFuncCall(expr);
				}
				else if(exprType === exprEnum.OBJECT) {
					this.defineObject(expr);
				}
				else if(exprType === exprEnum.RETURN) {
					this.defineReturn(expr);
				}
				else {
					console.log("unhandled");
				}
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

				if(exprType === exprEnum.RETURN) {
					this.defineReturn(expr);
				}				
			}
		}

		this.output += "\n";
	},


	defineVar: function(varExpr)
	{
		if(varExpr.type === Variable.Type.UNKNOWN) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - unknown type.");
			return;
		}

		this.output += this.tabs;

		var varType = Variable.Type;
		var expr = varExpr.expr;

		if(varExpr.type === varType.OBJECT) {
			this.output += expr.name + " " + varExpr.name + ";\n";
		}
		else if(varExpr.type === varType.STRING) {
			this.output += "char *" + varExpr.name + " = \"" + expr.length + "\"\"" + expr.value + "\";\n";
		}
		else 
		{
			if(this.scope === this.global && varExpr.expr.exprType === Expression.Type.BINARY) {
				this.output += this.varMap[varExpr.type] + " " + varExpr.name + ";\n";
			}
			else {				
				this.output += this.varMap[varExpr.type] + " " + varExpr.name + " = ";
				this.defineExpr(expr);
				this.output += ";\n";
			}
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

		this.output += "\n" + this.varMap[func.returnVar.type] + " " + func.name + "(";

		if(numParams) 
		{
			var varDef;
			for(var i = 0; i < numParams - 1; i++) {
				varDef = params[i];
				this.output += this.varMap[varDef.type] + " " + varDef.name + ", ";
			}
			varDef = params[i];
			this.output += this.varMap[varDef.type] + " " + varDef.name;
		}

		this.output += ") \n{\n";
		
		this.incTabs();
		this.define(func.scope);
		this.decTabs();

		this.output += "}\n";
	},

	defineObject: function(obj)
	{
		this.output += "typedef struct " + obj.name + " {\n";
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
		if(varExpr.type === Variable.Type.UNKNOWN) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - unknown type.");
			return "";
		}

		this.output += this.tabs + varExpr.name + " = ";

		var exprType = Expression.Type;
		var expr = varExpr.expr;
		if(expr.exprType === exprType.NUMBER) {
			this.output += expr.value;
		}
		else if(expr.exprType === exprType.VAR) {
			this.output += expr.name;
		}		
		else if(expr.exprType === exprType.STRING) {
			this.output += "\"" + expr.length + expr.value + "\"";
		}
		else if(expr.exprType === exprType.BINARY) {
			this.output += this._makeVarBinary(expr);
		}
		else {
			this.output += expr.value;
		}

		this.output += ";\n";
	},

	makeFuncCall: function(funcCall) 
	{
		var params = funcCall.params;
		var numParams = 0;
		if(params) {
			numParams = params.length;
		}

		if(numParams === 0) {
			this.output += this.tabs + funcCall.name + "();\n";
		}
		else 
		{
			this.output += this.tabs + funcCall.name + "(";

			this.writeVar(params[0]);
			for(var i = 1; i < numParams; i++) {
				this.output += ", ";
				this.writeVar(params[i]);
			}

			this.output += ");\n";
		}
	},	

	makeVarExpr: function(varExpr)
	{
		if(varExpr.type === Variable.Type.UNKNOWN) {
			console.warn("[Compiler.makeVar]:", "Variable \"" + varExpr.name + "\" is discarded - unknown type.");
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
		else if(expr.exprType === exprType.STRING) {
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
			if(binExpr.lhs.type === Variable.Type.STRING) {
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

	makeFunction: function(funcExpr)
	{
		var output = "function " + funcExpr.name + "() {};";
		return output;
	},


	writeVar: function(varExpr) 
	{
		var exprType = varExpr.exprType;
		var exprEnum = Expression.Type;

		if(exprType === exprEnum.NUMBER) {
			this.output += varExpr.value;
		}
		else if(exprType === exprEnum.VAR) {
			this.output += varExpr.name;
		}		
		else if(exprType === exprEnum.STRING) {
			this.output += "\"" + varExpr.length + "\"\"" + varExpr.value + "\"";
		}
		else if(exprType === exprEnum.BINARY) {
			this.output += this._makeVarBinary(varExpr);
		}
		else {
			this.output += varExpr.value;
		}
	},


	incTabs: function() {
		this.tabs += "\t";
	},

	decTabs: function() {
		this.tabs = this.tabs.substr(0, this.tabs.length - 1);
	}
};