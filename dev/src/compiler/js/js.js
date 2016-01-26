"use strict";

dopple.compiler.js =
{
	compile: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		this.output = {};

		this.output = this.parseBody(scope);

		return this.output;
	},

	parseBody: function(scope)
	{
		var output = "";
		var funcOutput = "";

		var node;
		var body = scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.exprType.VAR:
					output += this.parseVar(node);
					break;

				case this.exprType.FUNCTION_CALL:
					output += this.parseFuncCall(node);
					break;

				case this.exprType.FUNCTION:
					funcOutput += this.parseFunc(node);
					break;

				default:
					throw "unhandled";
			}
		}

		output = funcOutput + output;
		funcOutput = null;

		return output;
	},

	parseNumber: function(node) {
		return node.value;
	},

	parseBool: function(node) {
		return node.value ? "true" : "false";
	},

	parseString: function(node) {
		return "\"" + node.value + "\"";
	},

	parseId: function(node) {
		return node.value;
	},

	parseBinary: function(node) {
		return this.parseValue(node.lhs) + " " + node.op + " " + this.parseValue(node.rhs);
	},

	parseVar: function(node)
	{
		var ref = node.ref;

		var output = "";

		output += "var " + this.parseName(ref.name);
		output += " = " + this.parseValue(ref.value) + ";\n";

		return output;
	},

	parseRef: function(node)
	{
		var output = node.name;

		return output;
	},

	parseFunc: function(node)
	{
		var output = "function";

		if(node.name) {
			output += " " + node.name;
		}

		output += "(" + this.parseParams(node.params) + ")\n{\n";

		output += "}\n\n";

		return output;
	},

	parseFuncCall: function(node)
	{
		var output = this.parseName(node.name) + "(" + this.parseArgs(node.args) + ");\n";

		return output;
	},

	parseName: function(node)
	{
		var output = "";

		if(node.exprType === this.exprType.IDENTIFIER) {
			output += node.value;
		}
		else {
			throw "unhandled";
		}

		return output;
	},

	parseParams: function(buffer)
	{
		var output = "";

		var num = buffer.length;
		if(num > 0)
		{
			num--;
			
			for(var n = 0; n < num; n++) {
				output += this.parseValue(buffer[n]) + ", ";
			}
			output += this.parseValue(buffer[n]);			
		}

		return output;
	},

	parseArgs: function(buffer)
	{
		var output = "";

		var num = buffer.length;
		if(num > 0)
		{
			num--;
			
			for(var n = 0; n < num; n++) {
				output += this.parseValue(buffer[n]) + ", ";
			}
			output += this.parseValue(buffer[n]);			
		}

		return output;
	},

	parseValue: function(node)
	{
		switch(node.exprType)
		{
			case this.exprType.NUMBER:
				return this.parseNumber(node);

			case this.exprType.BOOL:
				return this.parseBool(node);				

			case this.exprType.STRING:
				return this.parseString(node);

			case this.exprType.IDENTIFIER:
				return this.parseId(node);

			case this.exprType.REFERENCE:
				return this.parseRef(node);

			case this.exprType.BINARY:
				return this.parseBinary(node);

			default:
				throw "unhandled";
		}
	},

	//
	scope: null,
	globalScope: null,
	output: null,

	types: dopple.types,
	subType: dopple.SubType,
	exprType: dopple.ExprType	
};
