"use strict";

dopple.compiler.js =
{
	compile: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		this.output = {};

		this.output = "\"use strict\"\n\n";
		this.output += this.parseBody(scope) + "\n";
		this.output += this.clsOutput;

		return this.output;
	},

	parseScope: function(scope)
	{
		this.tabs += "\t";

		var output = this.parseBody(scope);

		this.tabs = this.tabs.substr(0, this.tabs.length - 1);

		return output;
	},

	parseBody: function(scope)
	{
		var output = "";
		var tmpOutput = "";

		// parse classes:
		var cls;
		var bodyCls = scope.bodyCls;
		var num = scope.bodyCls.length;
		if(num > 0)
		{
			for(var n = 0; n < num; n++)
			{
				cls = bodyCls[n];

				tmpOutput += this.parseCls(cls) + "\n";
			}

			if(tmpOutput)
			{
				output += tmpOutput;
				tmpOutput = "";
			}
		}
	
		// parse functions:
		var func;
		var bodyFuncs = scope.bodyFuncs;
		num = bodyFuncs.length;
		if(num > 0)
		{		
			for(n = 0; n < num; n++)
			{
				func = bodyFuncs[n];
				if(func.flags & dopple.Flag.HIDDEN) { continue; }

				tmpOutput += this.parseFunc(func) + "\n\n";
			}

			if(tmpOutput)
			{
				output += tmpOutput;
				tmpOutput = "";
			}
		}

		//
		var node;
		var vars = scope.vars;
		for(var key in vars) 
		{
			node = vars[key];
			if(node.exprType === this.exprType.FUNCTION) { continue; }
			if(node.flags & dopple.Flag.HIDDEN) { continue; }
			if(node.flags & dopple.Flag.INTERNAL_TYPE) { continue; }
			if(node.flags & dopple.Flag.PARAM) { continue; }

			tmpOutput += this.tabs + "var " + key + " = " + this.parseValue(node) + ";\n";
		}	

		if(tmpOutput) {
			output += tmpOutput + "\n";
			tmpOutput = "";
		}

		if(this.insideObj === 0 && this.clsOutput) {
			output += this.clsOutput + "\n";
			this.clsOutput = "";
		}	

		//
		var body = scope.body;
		num = body.length;
		for(n = 0; n < num; n++)
		{
			node = body[n];
			if(!node) { continue; }
			if(node.flags & dopple.Flag.HIDDEN) { continue; }

			tmpOutput += this.tabs;

			switch(node.exprType)
			{
				case this.exprType.ASSIGN:
					tmpOutput += this.parseAssign(node) + ";";
					break;

				case this.exprType.IF:
					tmpOutput += this.parseIf(node);
					break;		

				case this.exprType.FUNCTION_CALL:
					tmpOutput += this.parseFuncCall(node) + ";";
					break;

				case this.exprType.NEW: 
					tmpOutput += this.parseNew(node) + ";";
					break;

				case this.exprType.RETURN:
					tmpOutput += this.parseReturn(node) + ";";
					break;

				default:
					throw "unhandled";
			}			

			tmpOutput += "\n";

			if(this.insideObj === 0) {
				tmpOutput += this.clsOutput;
				this.clsOutput = "";
			}			
		}

		output += tmpOutput;

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

	parseRegex: function(node) {
		return node.value;
	},

	parseBinary: function(node) {
		return this.parseValue(node.lhs) + " " + node.op + " " + this.parseValue(node.rhs);
	},

	parseLogical: function(node) {
		return this.parseValue(node.lhs) + " " + node.op + " " + this.parseValue(node.rhs);
	},

	parseAssign: function(node)
	{
		var output = this.parseName(node.left) + " " + node.op + " " + this.parseValue(node.right);

		return output;
	},

	parseIf: function(node)
	{
		var output = "if" + this._parseBranch(node.branchIf);
		return output;
	},

	_parseBranch: function(branch)
	{
		var output = "(" + this.parseValue(branch.value) + ")\n";
		output += this.tabs + "{\n";
		output += this.parseScope(branch.scope);
		output += this.tabs + "}";

		return output;
	},

	parseNew: function(node) 
	{
		var output = "new " + this.parseName(node.name);

		if(node.args) {
			output += "(" + this.parseArgs(node.args) + ")";
		}

		return output;
	},

	parseNull: function(node)
	{
		return "null";
	},

	parseMember: function(node)
	{
		var output = this.parseName(node);
		return output;
	},

	parseObj: function(node)
	{
		this.insideObj++;

		var isEmpty = true;
		var vars = node.scope.vars;
		for(var key in vars) {
			isEmpty = false;
			break;
		}

		var output;
		if(!isEmpty) {
			output = "\n" + this.tabs + "{\n" + this.parseProto(vars) + "\n" + this.tabs + "}";
		}
		else {
			output = "{}";
		}

		this.insideObj--;
		
		return output;
	},

	parseArray: function(node)
	{
		var output;

		if(node.elements)
		{
			output = "[ "

			var elements = node.elements;
			var num = elements.length - 1;
			for(var n = 0; n < num; n++) {
				output += this.parseValue(elements[n]) + ", ";
			}
			output += this.parseValue(elements[n]);

			output += " ]";
		}
		else {
			output = "[]";
		}

		return output;
	},

	parseSetter: function(node)
	{
		var scopeOutput = this.parseScope(node.value.scope);

		var output = "(" + this.parseParams(node.value.params) + ")\n" + this.tabs + "{\n";
		
		if(scopeOutput) {
			output += scopeOutput;
		}

		output += this.tabs + "}";

		return output;
	},

	parseGetter: function(node)
	{
		var scopeOutput = this.parseScope(node.value.scope);

		var output = "()\n" + this.tabs + "{\n";
		
		if(scopeOutput) {
			output += scopeOutput;
		}

		output += this.tabs + "}";

		return output;
	},

	parseVar: function(key, node)
	{
		var output = "var " + key + this.parseType(node);
		output += " = " + this.parseValue(node);

		return output;
	},

	parseRef: function(node)
	{
		var output = this.parseName(node.name);
		return output;
	},

	parseReturn: function(node)
	{
		var output = "return";
		if(node.value) {
			output += " " + this.parseValue(node.value);
		}

		return output;
	},	

	parseFunc: function(node)
	{
		var output = "function";

		if(node.name) {
			output += " " + node.name;
		}

		output += "(" + this.parseParams(node.params) + ")\n";
		output += this.tabs + "{\n";
		output += this.parseScope(node.scope);
		output += this.tabs + "}";

		return output;
	},

	parseFuncCall: function(node)
	{
		var output = this.parseName(node.name) + "(" + this.parseArgs(node.args) + ")";

		return output;
	},

	parseCls: function(node)
	{
		var vars = node.scope.vars;
		var haveVars = false;
		for(var key in vars) {
			haveVars = true;
			break;
		}

		var output = this.parseFunc(node.constrFunc);
		if(this.insideObj === 0) {
			output += "\n\n"
		}

		var clsOutput =  this.genNameFromBuffer(node.nameBuffer) + ".prototype = \n{\n";

		if(haveVars) {
			var prevTabs = this.tabs;
			this.tabs = "";
			clsOutput += this.parseProto(node.scope.vars) + "\n";
			this.tabs = prevTabs;
		}

		clsOutput += "};\n";

		if(this.insideObj) 
		{
			if(this.clsOutput) {
				this.clsOutput += clsOutput;
			}
			else {
				this.clsOutput += clsOutput + "\n";
			}
		}
		else {
			output += clsOutput;
		}

		return output;
	},

	parseProto: function(vars)
	{
		this.tabs += "\t";		

		var output = "";
		var added = false;

		var node;
		for(var key in vars)
		{
			if(added) {
				output += ",\n";
			}

			node = vars[key];
			if(node.exprType === this.exprType.SETTER_GETTER)
			{
				if(node.setter) {
					output += this.tabs + "set " + key + this.parseSetter(node.setter);
				}
				if(node.getter) 
				{
					if(node.setter) {
						output += ",\n";
					}
					output += this.tabs + "get " + key + this.parseGetter(node.getter);
				}
			}
			else 
			{
				output += this.tabs + key + ": " + this.parseValue(node);
			}
			
			added = true;
		}

		this.tabs = this.tabs.substr(0, this.tabs.length - 1);

		return output;
	},

	parseName: function(node)
	{
		var output = "";

		if(node.exprType === this.exprType.IDENTIFIER) {
			output += node.value;
		}
		else if(node.exprType === this.exprType.MEMBER) {
			output += this.parseName(node.left) + "." + this.parseName(node.right);
		}
		else if(node.exprType === this.exprType.THIS) {
			output += "this";
		}
		else {
			throw "unhandled";
		}

		return output;
	},

	parseType: function(node)
	{
		return "";
		
		var output = ":" + node.cls.name;
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

			case this.exprType.MEMBER:
				return this.parseMember(node);

			case this.exprType.BINARY:
				return this.parseBinary(node);

			case this.exprType.LOGICAL:
				return this.parseLogical(node);

			case this.exprType.ASSIGN:
				return this.parseAssign(node);

			case this.exprType.NEW:
				return this.parseNew(node);	

			case this.exprType.NULL:
				return this.parseNull(node);

			case this.exprType.OBJECT:
				return this.parseObj(node);

			case this.exprType.ARRAY:
				return this.parseArray(node);

			case this.exprType.FUNCTION_CALL:
				return this.parseFuncCall(node);

			case this.exprType.FUNCTION:
				return this.parseFunc(node);

			case this.exprType.CLASS:
				return this.parseCls(node);

			case this.exprType.REGEX:
				return this.parseRegex(node);

			default:
				throw "unhandled";
		}
	},

	genNameFromBuffer: function(buffer)
	{
		var str = "";
		var num = buffer.length - 1;
		for(var n = 0; n < num; n++) {
			str += buffer[n] + ".";
		}

		str += buffer[n];

		return str;
	},

	//
	scope: null,
	globalScope: null,
	output: "",
	clsOutput: "",

	tabs: "",
	insideObj: 0,

	types: dopple.types,
	subType: dopple.SubType,
	exprType: dopple.ExprType
};
