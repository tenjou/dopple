"use strict";

dopple.compiler = {};
dopple.compiler.cpp = 
{
	prepare: function() 
	{
		this.ast = dopple.AST;
		this.type = dopple.Type;
		this.flagType = dopple.Flag;
		this.nativeVars = dopple.nativeVars;

		this.scope = dopple.scope;
		this.global = this.scope;

		this.lookup = [];
		this.lookup[this.type.NUMBER] = this.parseNumber;
		this.lookup[this.type.STRING] = this.parseString;
		this.lookup[this.type.BOOL] = this.parseBool;
		this.lookup[this.type.REFERENCE] = this.parseRef;
		this.lookup[this.type.NEW] = this.parseNew;
		this.lookup[this.type.BINARY] = this.parseBinary;
		this.lookup[this.type.IF] = this.parseIf;
		this.lookup[this.type.VAR] = this.parseVar;
		this.lookup[this.type.ASSIGN] = this.parseAssign;
		this.lookup[this.type.UNARY] = this.parseUnary;
		this.lookup[this.type.FUNCTION] = this.parseFunc;
		this.lookup[this.type.FUNCTION_CALL] = this.parseFuncCall;
		this.lookup[this.type.RETURN] = this.parseReturn;
		this.lookup[this.type.NULL] = this.parseNull;
		this.lookup[this.type.ARRAY] = this.parseArray;

		this.argLookup = [];
		this.argLookup[this.type.NUMBER] = this.parseArgNumber;
		this.argLookup[this.type.STRING] = this.parseArgString;
		this.argLookup[this.type.BOOL] = this.parseArgBool;
		this.argLookup[this.type.REFERENCE] = this.parseArgRef;
	},

	compile: function()
	{
		var mainReturn = new dopple.AST.Return(new dopple.AST.Number(0));
		this.scope.body.push(mainReturn);

		var output = "#include \"dopple.h\"\n\n";

		var clsOutput = this.parseClasses(this.scope.classes);
		if(clsOutput) {
			output += clsOutput + "\n";
		}

		var scopeOutput = "int main(int argc, char **argv) \n{\n";
		scopeOutput += this.parseScope(this.scope);
		scopeOutput += "}\n";

		// Write global scope declarations:
		var cache = this.scope.cache;
		if(cache.declOutput) {
			output += cache.declOutput + "\n";
			cache.declOutput = "";
		}

		var funcOutput = this.parseFuncs(this.scope.funcs);
		if(funcOutput) {
			output += funcOutput;
		}

		output += scopeOutput;

		return output;
	},

	parseScope: function(scope)
	{
		var prevScope = this.scope;
		this.scope = scope;

		this.incTabs();

		if(!this.scope.virtual)	{
			this.parseScopeDecls();			
		}

		// Output the rest of the scope:
		var output = "";
		var nodeOutput = "";
		var cache = this.scope.cache;		
		var node = null;
		var body = scope.body;
		var num = body.length;
		for(var n = 0; n < num; n++) 
		{
			node = body[n];
			if(!node || node.flags & this.flagType.HIDDEN) { continue; }

			nodeOutput = this.lookup[node.type].call(this, node);

			if(cache.preOutput) {
				output += cache.preOutput;
				cache.preOutput = "";
			}
			if(nodeOutput) 
			{
				output += this.tabs + nodeOutput;
				if(node.type === this.type.IF) {
					output += "\n";
				}
				else {
					output += ";\n";
				}
			}
		}	

		if(!this.scope.virtual && this.scope !== this.global)
		{
			var cache = this.scope.cache;
			if(cache.declOutput) 
			{
				if(output) {
					output = cache.declOutput + "\n" + output;
				}
				else {
					output = cache.declOutput;
				}

				cache.declOutput = "";
			}
		}

		this.decTabs();	

		this.scope = prevScope;

		return output;	
	},

	parseScopeDecls: function()
	{
		var cache = this.scope.cache;
		var decls = cache.decls;
		if(!decls) { return; }

		var declGroups = cache.declGroups;
		if(!declGroups) {
			declGroups = {};
			cache.declGroups = declGroups;
		}

		var strType = "";
		var typeBuffer = null;		

		// Group declerations in hashmap:
		var node = null;
		var num = decls.length;
		for(var n = 0; n < num; n++) 
		{
			node = decls[n];

			strType = this.createType(node);
			typeBuffer = declGroups[strType];
			if(!typeBuffer) {
				typeBuffer = [ node ];
				declGroups[strType] = typeBuffer;
			}
			else {
				typeBuffer.push(node);
			}
		}

		this.outputScopeDecls();				
	},

	outputScopeDecls: function()
	{
		// Output group by group all declerations:
		var tabs = this.tabs;
		if(this.scope === this.global) {
			tabs = "";
		}

		var n, num, node, typeBuffer;
		var cache = this.scope.cache;
		var declGroups = cache.declGroups;

		for(var key in declGroups)
		{
			typeBuffer = declGroups[key];
			cache.declOutput += tabs + key;
			num = typeBuffer.length - 1;
			for(n = 0; n < num; n++) 
			{
				node = typeBuffer[n];
				this._outputScopeNode(node);

				if(node.flags & this.flagType.PTR) { 
					cache.declOutput += ", *";
				}	
				else {
					cache.declOutput += ", ";
				}		
			}

			this._outputScopeNode(typeBuffer[n]);
			cache.declOutput += ";\n";
		}		
	},

	_outputScopeNode: function(node) 
	{
		if(node.flags & this.flagType.MEMORY_STACK) {
			this.scope.cache.declOutput += this.createName(node);
		}	
		else if(node.value && node.value.flags & this.flagType.KNOWN) 
		{
			this.scope.cache.declOutput += this.createName(node) + " = " + 
				this.lookup[node.value.type].call(this, node.value);

			node.flags |= this.flagType.HIDDEN;
		}	
		else 
		{
			this.scope.cache.declOutput += 
				this.createName(node) + " = " + this.createDefaultValue(node);
		}
	},

	parseNumber: function(node) {
		return node.value;
	},

	parseString: function(node) 
	{
		var length = node.value.length;
		var hex = "\"\\x" + (length & 0x000000FF).toString(16);
		
		if(length > 255) {
			hex += "\\x" + (length & 0x0000FF00).toString(16);
			hex += "\\x" + (length & 0x00FF0000).toString(16);
			hex += "\\x" + (length & 0xFF000000).toString(16) + "\"";
		}
		else {
			hex += "\\x0\\x0\\x0\"";
		}
		return "(char *)" + hex + "\"" + node.value + "\"";
	},

	parseBool: function(node) 
	{
		if(node.value === 1) {
			return "true";
		}
		return "false";
	},

	parseRef: function(node) 
	{
		if(node.value && node.value.flags & this.flagType.GETTER) {
			return this.createGetterName(node);
		}

		return this.createName(node);
	},

	parseNew: function(node) 
	{
		if(!node.args) {
			return null;
		}

		var output;

		if(node instanceof dopple.AST.Var) {
			output = node.cls.name + "(" + this.parseArgs(node) + ")";
		}
		else {
			output = node.name + "(" + this.parseArgs(node) + ")";
		}

		if((node.flags & this.flagType.MEMORY_STACK) === 0) {
			output += "new " + output;
		}

		return output;
	},	

	parseBinary: function(node) 
	{
		var output = 
			this.lookup[node.lhs.type].call(this, node.lhs) + 
			" " + node.op + " " +
			this.lookup[node.rhs.type].call(this, node.rhs);		

		return output;
	},

	parseIf: function(node)
	{
		var output = "if(" + this.lookup[node.value.type].call(this, node.value)+ ")\n";
		output += this.tabs + "{\n";
		output += this.parseScope(node.scope);
		output += this.tabs + "}";

		return output;
	},

	parseVar: function(node) 
	{
		var output;

		if(node.flags & this.flagType.SETTER) 
		{
			output = this.createSetterName(node) + "(" 
				+ this.lookup[node.value.type].call(this, node.value) + ")";
		}
		else 
		{
			if(node.value) 
			{
				var valueOutput = this.lookup[node.value.type].call(this, node.value);
				if(valueOutput) {
					output = this.createName(node) + " = " + valueOutput;
				}
			}
		}

		return output;
	},

	parseAssign: function(node) {
		return this.parseVar(node);
	},

	parseUnary: function(node) {
		var output = node.op + this.lookup[node.value.type].call(this, node.value);
		return output;
	},

	parseArray: function(node) 
	{
		var genVarName = "";

		var elements = node.elements;
		var num = 0;
		if(elements)
		{
			var elementOutput = "";
			var elementNode = null;
			var num = elements.length;
			var iterNum = num - 1;

			for(var n = 0; n < iterNum; n++) {
				elementNode = elements[n];
				elementOutput += this.lookup[elementNode.type].call(this, elementNode) + ", ";
			}
			elementNode = elements[n];
			elementOutput += this.lookup[elementNode.type].call(this, elementNode);

			genVarName = this.scope.genVar(node.templateCls);

			var templateTypeName = this.createTemplateType(node);
			var preOutput = this.tabs + templateTypeName;
			if(templateTypeName[templateTypeName.length - 1] !== "*") {
				preOutput += " ";
			}
			preOutput += genVarName + "[" + num + "] = { " + elementOutput;
			preOutput += " };\n";
			this.scope.cache.preOutput += preOutput;
		}
		else {
			return "";
		}

		var output;

		if(this.isParsingArgs) {
			output = genVarName + ", " + num;
		}
		else {
			output = "Array<" + this.createTemplateType(node) + ">(" + genVarName + ")";
		}
		
		return output;
	},

	parseFuncs: function(funcs) 
	{
		if(!funcs) { return ""; }

		var output = "";

		var func = null;
		var num = funcs.length;
		for(var n = 0; n < num; n++) 
		{
			func = funcs[n];
			if((func.flags & this.flagType.RESOLVED) === 0) { continue; }

			output += this.parseFunc(func) + "\n";
		}

		return output;
	},	

	parseFunc: function(node)
	{
		var scopeOutput = this.parseScope(node.scope);

		var output = this.createType(node.value) + node.name;
		output += "(" + this.parseParams(node.params) + ") \n{\n";
		
		if(this.declOutput) {
			output += this.declOutput + "\n";
		}
		
		output += scopeOutput;
		output += "}\n";

		return output;
	},

	parseParams: function(params)
	{
		var output;
		var node = params[0];
		var num = params.length;

		if(num > 0)
		{
			output = this.createType(node) + node.name;

			for(var n = 1; n < num; n++) {
				node = params[n];
				output += ", " + this.createType(node) + node.name;
			}
		}
		else {
			output = "";
		}

		return output;
	},

	parseArgs: function(node)
	{
		var params = node.func.params;
		if(!params) { return ""; }

		this.isParsingArgs = true;

		var numParams = params.length

		var param, arg;
		var args = node.args;
		var numArgs = args.length;

		var output = "";
		var n = 0;

		if(numArgs > 0)
		{
			arg = args[0];
			param = params[0];

			var argsIndex = node.func.argsIndex;
			if(argsIndex > -1)
			{
				if(param.cls === this.nativeVars.Args) {
					output = this.createStrArgs(args, 0);
				}				
			}
			else 
			{
				output = this.lookup[arg.type].call(this, arg);

				for(n = 1; n < numArgs; n++) {
					arg = args[n];
					output += ", " + this.lookup[arg.type].call(this, arg);
				}				
			}
		}

		if(numArgs < numParams)
		{
			if(n === 0) {
				output += this.createDefaultValue(params[n]);
				n++;
			}

			for(; n < numParams; n++) {
				output += ", " + this.createDefaultValue(params[n]);
			}
		}

		this.isParsingArgs = false;

		return output;
	},

	parseFuncCall: function(node) {
		var output = this.createName(node) + "(" + this.parseArgs(node) + ")";
		return output;
	},

	parseReturn: function(node)
	{
		var output = "return";

		if(node.value) {
			output += " " + this.lookup[node.value.type].call(this, node.value);
		}
		
		return output;
	},

	parseClasses: function(classes)
	{
		var output = "";

		var cls = null;
		var num = classes.length;
		for(var n = 0; n < num; n++) {
			output += this.parseClass(classes[n]) + "\n";
		}

		return output;
	},

	parseClass: function(node)
	{
		var output = null;

		if(node.global) {
			output = "struct {\n";
			output += this.parseScope(node.scope);
			output += "} " + node.name + ";\n";
		}
		else {
			output = "struct " + node.name + "{\n";
			output += this.parseScope(node.scope);
			output += "}\n";		
		}

		return output;
	},

	parseNull: function(node) {
		return "nullptr";
	},

	parseGlobalVars: function(body)
	{
		var output = "";

		var node = null;
		var num = body.length;
		for(var n = 0; n < num; n++) 
		{
			node = body[n];
			if(!node || node.type !== this.type.VAR || node.flags & this.flagType.EXTERN) { continue; }

			output += this.createType(node) + this.createName(node) + 
				" = " + this.createDefaultValue(node) + ";\n";
		}

		return output;
	},

	createType: function(node)
	{
		if(!node) {
			return "void ";
		}

		if(!node.cls || node.cls.clsType === this.type.NULL) {
			return "void *";
		}

		var name = node.cls.alt;

		if(node.cls.flags & this.flagType.TEMPLATE) {
			name += "<" + this.createTemplateType(node) + ">";
		}			

		if(node.flags & this.flagType.PTR && 
	       (node.flags & this.flagType.MEMORY_STACK) === 0) 
		{
			name += " *";
		}
		else {
			name += " ";
		}

		return name;
	},

	createTemplateType: function(node)
	{
		if(!node || !node.templateValue) {
			return "void *";
		}

		var name = node.templateValue.cls.alt;		

		if(node.templateValue.flags & this.flagType.PTR) {
			name += " *";
		}

		if(node.templateValue.templateValue) {
			name += "<" + this.createTemplateType(node.templateValue) + ">";
		}

		return name;
	},	

	createDefaultValue: function(node) 
	{
		if(node.cls)
		{
			var type = node.cls.name;
			if(type === "Number") {
				return "0";
			}
			else if(type === "Boolean") {
				return "false";
			}
			else if(type === "Args") {
				return "";
			}
		}

		return "nullptr";
	},

	createNamePath: function(node)
	{
		var name = "";
		var parents = node.parents;

		if(parents) 
		{
			var scope = this.scope;
			var parentNode = null;
			var parentName = null;
			var num = parents.length;
			for(var n = 0; n < num; n++) 
			{
				parentName = parents[n];

				for(;;)
				{
					parentNode = scope.vars[parentName];
					if(parentNode) { break; }

					scope = scope.parent;
					if(!scope) {
						throw "ReferenceError: " + paretName + " is not defined";
					}
				}
				
				name += parentName; 
				if(parentNode.flags & this.flagType.MEMORY_STACK || parentNode.global) {
					name += "."
				}
				else {
					name += "->";
				}

				scope = parentNode.scope;
			}
		}

		return name;		
	},

	createName: function(node) {
		return this.createNamePath(node) + node.name;
	},	

	createSetterName: function(node) {
		return this.createNamePath(node) + "__setter__" + node.name;
	},

	createGetterName: function(node) {
		return this.createNamePath(node) + "__getter__" + node.name + "()";
	},

	createStrArgs: function(args, index) 
	{
		var cache = new this.ArgCache();
		var numArgs = args.length;

		var arg = args[0];
		this.argLookup[arg.type].call(this, arg, cache, 0);

		for(var n = 1; n < numArgs; n++) {
			arg = args[n];
			this.argLookup[arg.type].call(this, arg, cache, n);
		}

		var output = "\"" + cache.format + "\\n\"" + cache.args;

		return output;
	},

	parseArgNumber: function(node, cache, index) 
	{
		if(index === 0) {
			cache.format += "%.17g";	
		}
		else {
			cache.format += " %.17g";		
		}

		if(node.value === Math.floor(node.value)) {
			cache.args += ", " + node.value + ".0";
		}
		else {
			cache.args += ", " + node.value;
		}
	},

	parseArgString: function(node, cache, index) 
	{
		if(index === 0) {
			cache.format += "%s";
		} 
		else {
			cache.format += " %s";
		}

		cache.args += ", \"" + node.value + "\"";
	},

	parseArgBool: function(node, cache, index) 
	{
		if(index === 0) {
			cache.format += "%s";			
		}
		else {
			cache.format += " %s";		
		}

		if(node.value === 1) {
			cache.args += ", \"true\"";
		}
		else {
			cache.args += ", \"false\"";
		}
	},

	parseArgRef: function(node, cache, index) {
		return "";
	},

	incTabs: function() {
		this.tabs += "\t";
	},

	decTabs: function() {
		this.tabs = this.tabs.substr(0, this.tabs.length - 1);
	},	

	ArgCache: function() {
		this.format = "";
		this.args = "";
	},

	//
	scope: null,
	global: null,

	lookup: null,
	argLookup: null,
	tabs: "",

	ast: null,
	type: null,
	flagType: null,

	nativeVars: null,

	isParsingArgs: false
};
