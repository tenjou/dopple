"use strict";

dopple.compiler.cpp = 
{
	prepare: function() 
	{
		this.ast = dopple.AST;
		this.type = dopple.Type;
		this.flagType = dopple.Flag;

		this.types = dopple.types;
		this.typeVars = dopple.typeVars;

		this.scope = dopple.scope;
		this.global = this.scope;

		this.lookup = [];
		this.lookup[this.type.NUMBER] = this.outputNumber;
		this.lookup[this.type.STRING] = this.parseString;
		this.lookup[this.type.BOOL] = this.parseBool;
		this.lookup[this.type.REFERENCE] = this.parseRef;
		this.lookup[this.type.NEW] = this.parseNew;
		this.lookup[this.type.BINARY] = this.parseBinary;
		this.lookup[this.type.IF] = this.parseIf;
		this.lookup[this.type.CONDITIONAL] = this.parseConditional;
		this.lookup[this.type.VAR] = this.parseVar;
		this.lookup[this.type.ASSIGN] = this.parseAssign;
		this.lookup[this.type.UNARY] = this.parseUnary;
		this.lookup[this.type.FUNCTION] = this.parseFunc;
		this.lookup[this.type.FUNCTION_CALL] = this.parseFuncCall;
		this.lookup[this.type.FUNCTION_DEF] = this.outputFuncDef;
		this.lookup[this.type.RETURN] = this.parseReturn;
		this.lookup[this.type.NULL] = this.parseNull;
		this.lookup[this.type.ARRAY] = this.parseArray;
		this.lookup[this.type.SUBSCRIPT] = this.outputSubscript;

		this.argLookup = [];
		this.argLookup[this.type.NUMBER] = this.outputArgNumber;
		this.argLookup[this.type.STRING] = this.outputArgString;
		this.argLookup[this.type.BOOL] = this.outputArgBool;
		this.argLookup[this.type.REFERENCE] = this.outputArgRef;
		this.argLookup[this.type.FUNCTION_CALL] = this.outputArgFuncCall;
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

			nodeOutput = this.lookup[node.exprType].call(this, node, 0);

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

			strType = this.createType(node.value);
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

		var n, num, node, typeBuffer, separator;
		var cache = this.scope.cache;
		var declGroups = cache.declGroups;

		for(var key in declGroups)
		{
			typeBuffer = declGroups[key];
			cache.declOutput += tabs + key;
			num = typeBuffer.length - 1;

			node = typeBuffer[0];
			if((node.flags & this.flagType.PTR) && ((node.flags & this.flagType.MEMORY_STACK) === 0)) { 
				separator = ", *";
			}	
			else {
				separator = ", ";
			}

			for(n = 0; n < num; n++) 
			{
				node = typeBuffer[n];

				this._outputScopeNode(node);
				cache.declOutput += separator;		
			}

			this._outputScopeNode(typeBuffer[n]);
			cache.declOutput += ";\n";
		}		
	},

	_outputScopeNode: function(node) 
	{
		if(node.flags & this.flagType.MEMORY_STACK) {
			this.scope.cache.declOutput += this.createName(node);
			return;
		}	

		var nodeValue = node.value;
		if(nodeValue && nodeValue.flags & this.flagType.KNOWN) 
		{
			this.scope.cache.declOutput += this.createName(node) + " = " + 
				this.lookup[nodeValue.exprType].call(this, nodeValue);

			node.flags |= this.flagType.HIDDEN;
		}	
		else 
		{
			this.scope.cache.declOutput += 
				this.createName(node) + " = " + this.createDefaultValue(node);
		}
	},

	outputNumber: function(node) {
		return node.outputValue + "";
	},

	parseString: function(node, flags) 
	{
		var length = node.outputValue.length;
		var hex = "\"\\x" + (length & 0x000000FF).toString(16);
		
		if(length > 255) {
			hex += "\\x" + (length & 0x0000FF00).toString(16);
			hex += "\\x" + (length & 0x00FF0000).toString(16);
			hex += "\\x" + (length & 0xFF000000).toString(16) + "\"";
		}
		else {
			hex += "\\x0\\x0\\x0\"";
		}
		return "(char *)" + hex + "\"" + node.outputValue + "\"";
	},

	parseBool: function(node, flags) {
		return node.outputValue + "";
	},

	parseRef: function(node, flags) 
	{
		var nodeValue = node.value;

		if(nodeValue) 
		{
			if(nodeValue.hook) {
				return nodeValue.hook(node.name);
			}

			if(nodeValue.flags & this.flagType.GETTER) {
				return this.createGetterName(node);
			}
		}

		return this.createName(node);
	},

	parseNew: function(node, parent, flags) 
	{
		var output = this.createType(node, true);

		if(node.flags & this.flagType.MEMORY_STACK) 
		{
			output += "(" + this.parseArgs(node.func, node.args) + ")";				

			if(flags & this.Flag.PARSING_ARGS) {
				var name = this.scope.genVar(node.cls);
				this.scope.cache.preOutput += this.tabs + this.createType(node) + name + " = " + output + ";\n";
				return name;
			}
		}
		else {
			output = "new " + output + "(" + this.parseArgs(node.func, node.args) + ")";
		}

		return output;
	},	

	parseBinary: function(node, flags) 
	{
		var output = 
			this.lookup[node.lhs.type].call(this, node.lhs, flags) + 
			" " + node.op + " " +
			this.lookup[node.rhs.type].call(this, node.rhs, flags);		

		return output;
	},

	parseIf: function(node)
	{
		var branch = node.branchIf;
		var output = "if(" + this.lookup[branch.value.type].call(this, branch.value, null)+ ")\n";
		output += this.tabs + "{\n";
		output += this.parseScope(branch.scope);
		output += this.tabs + "}";

		if(node.branchElseIf)
		{
			var branches = node.branchElseIf;
			var num = branches.length;
			for(var n = 0; n < num; n++) {
				branch = branches[n];
				output += "\n" + this.tabs + "else if(" + 
					this.lookup[branch.value.type].call(this, branch.value, null)+ ")\n";
				output += this.tabs + "{\n";
				output += this.parseScope(branch.scope);
				output += this.tabs + "}";				
			}
		}

		if(node.branchElse) {
			output += "\n" + this.tabs + "else\n";
			output += this.tabs + "{\n";
			output += this.parseScope(branch.scope);
			output += this.tabs + "}";				
		}

		return output;
	},

	parseConditional: function(node, flags)
	{
		var output = "(" + this.lookup[node.test.type].call(this, node.test, flags) + " ? ";
		output += this.lookup[node.value.type].call(this, node.value, flags) + " : ";
		output += this.lookup[node.valueFail.type].call(this, node.valueFail, flags) + ")";

		return output;
	},

	parseVar: function(node) 
	{
		var output = "";
		var nodeValue = node.value;

		if(nodeValue) 
		{
			var valueOutput = this.lookup[nodeValue.exprType].call(this, nodeValue, 0);
			if(valueOutput) {
				output = this.createName(node) + " = " + valueOutput;
			}
		}

		return output;
	},

	parseAssign: function(node, flags) 
	{
		var output;
		var nodeValue = node.value;

		if(node.flags & this.flagType.SETTER) 
		{
			output = this.createSetterName(node) + "(" 
				+ this.lookup[nodeValue.exprType].call(this, nodeValue, flags) + ")";
		}
		else 
		{
			if(nodeValue) 
			{
				var valueOutput = this.lookup[nodeValue.exprType].call(this, nodeValue, flags);
				if(valueOutput) {
					output = this.createName(node.lhs) + " " + node.op + " " + valueOutput;
				}
			}
		}

		return output;
	},

	parseUnary: function(node, flags) {
		var output = node.op + this.lookup[node.value.type].call(this, node.value, flags);
		return output;
	},

	parseArray: function(node, flags) 
	{
		var genVarName = "";

		var elements = node.elements;
		var num = 0, n = 0;
		if(elements)
		{
			var elementOutput = "";
			var elementNode = null;
			var num = elements.length;
			var iterNum = num - 1;

			// if(node.type !== parent.type) 
			// {
			// 	var castingPrefix = parent.type.alt + "(";

			// 	for(; n < iterNum; n++) {
			// 		elementNode = elements[n];
			// 		elementOutput += castingPrefix + this.lookup[elementNode.exprType].call(this, elementNode, flags) + "), ";
			// 	}
			// 	elementNode = elements[n];
			// 	elementOutput += castingPrefix + this.lookup[elementNode.exprType].call(this, elementNode, flags) + ")";					
			// }
			// else 
			// {
				for(; n < iterNum; n++) {
					elementNode = elements[n];
					elementOutput += this.lookup[elementNode.exprType].call(this, elementNode) + ", ";
				}
				elementNode = elements[n];
				elementOutput += this.lookup[elementNode.exprType].call(this, elementNode);
			//}

			genVarName = this.scope.genVar(node.templateType.type);

			// Stack array:
			var templateTypeName = this.createTemplateType(node.templateType);
			var preOutput = this.tabs + templateTypeName;
			if(templateTypeName[templateTypeName.length - 1] !== "*") {
				preOutput += " ";
			}
			preOutput += genVarName + "[" + num + "] = { " + elementOutput;
			preOutput += " };\n";

			// // New array:
			// var templateTypeName = this.createType(node);
			// var genVarName2 = this.scope.genVar(node.type);
			// preOutput += this.tabs + templateTypeName + genVarName2 + "(" + genVarName + ");\n";

			this.scope.cache.preOutput += preOutput;
		}
		else {
			return "";
		}

		var output;

		if(flags & this.Flag.PARSING_ARGS) {
			var strType = this.createType(node, true);
			var genVarName2 = this.scope.genVar();
			this.scope.cache.preOutput += this.tabs + strType + " " + genVarName2 + 
				"[1] = { " + strType + "(" + genVarName + ", " + num + ") };\n";
			output = genVarName2 + ", 1";
		}
		else {
			output = this.createType(node, true) + "(" + genVarName + ", " + num + ")";
		}
			
		// var tmpOutput = this.lookup[arg.exprType].call(this, arg, flags);
		// var genName = this.scope.genVar();

		// this.scope.cache.preOutput += this.tabs + this.createType(arg) + genName + "[1] = { " + tmpOutput + " };\n";
		// output = genName;


		

		// if(flags & this.Flag.PARSING_ARGS) {
		// 	//output = genVarName + ", " + num;
		// 	output = "&" + genVarName;
		// }
		// else {
			
	//	}
		
		return output;
	},

	outputSubscript: function(node)
	{
		var output = this.createName(node.value) + 
			"[" + this.lookup[node.accessValue.exprType].call(this, node.accessValue) + "]";

		return output;
	},

	parseFuncs: function(funcs, flags) 
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

	parseParams: function(params, flags)
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

	parseArgs: function(func, args)
	{
		var params = func.params;
		if(!params) { return ""; }

		var param, arg, n = 0;
		var numParams = params.length;
		var numArgs = args.length;

		var flags = this.Flag.PARSING_ARGS;
		var output = "";

		if(numArgs > 0)
		{
			arg = args[0];
			param = params[0];

			var argsIndex = func.argsIndex;
			if(argsIndex > -1)
			{
				if(param.type === this.types.Args) {
					output = this.createStrArgs(args, 0);
				}	
				else if(param.type === this.types.TypeArgs) {
					output = this.createTypeArgs(args, 0);
				}	
			}
			else 
			{
				output = this.lookup[arg.exprType].call(this, arg, flags);

				for(n = 1; n < numArgs; n++) {
					arg = args[n];
					output += ", " + this.lookup[arg.exprType].call(this, arg, flags);
				}				
			}
		}

		if(numArgs < numParams)
		{
			if(n === 0) 
			{
				param = params[n];
				if(param.value) {
					output += this.lookup[param.value.exprType].call(this, param.value, flags);
				}
				else {
					output += this.createDefaultValue(params[n]);
				}
				n++;
			}

			for(; n < numParams; n++) 
			{
				param = params[n];
				if(param.value) {
					output += ", " + this.lookup[param.value.exprType].call(this, param.value, flags);
				}
				else {
					output += ", " + this.createDefaultValue(params[n]);
				}
			}
		}

		return output;
	},

	parseFuncCall: function(node, parent, flags) 
	{
		var output;

		if(node.value.hook) {
			output = node.value.hook(node.name);
		}
		else {
			output = this.createName(node);
		}

		output += "(" + this.parseArgs(node.value, node.args, flags) + ")";
		
		return output;
	},

	outputFuncDef: function(node) {
		var output = node.name;
		return output;
	},

	parseReturn: function(node, flags)
	{
		var output = "return";
		var nodeValue = node.value;

		if(nodeValue) {
			output += " " + this.lookup[nodeValue.exprType].call(this, nodeValue, flags);
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

		// if(node.global) {
		// 	output = "struct {\n";
		// 	output += this.parseScope(node.scope);
		// 	output += "} " + node.name + ";\n";
		// }
		// else {
		// 	output = "struct " + node.name + "{\n";
		// 	output += this.parseScope(node.scope);
		// 	output += "}\n";		
		// }

		return output;
	},

	parseNull: function(node, flags) {
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

	createType: function(node, isConstr)
	{
		if(!node || !node.type) {
			return "void *";
		}	

		var typeNode, template;

		if(node.type.type === this.type.TEMPLATE) 
		{
			template = node.getTemplate();
			typeNode = template.type;
			if(!typeNode) {
				return "void *";
			}

			template = template.templateType;
		}
		else {
			typeNode = node.type;
			template = node.getTemplate();
		}

		var name = typeNode.alt;

		if(template) 
		{
			if((typeNode.flags & this.flagType.PTR) && (typeNode.flags & this.flagType.MEMORY_STACK) === 0) {
				name += " *<" + this.createTemplateType(template) + ">";
			}
			else {
				name += "<" + this.createTemplateType(template) + ">";
			}
		} 
		else 
		{
			if((typeNode.flags & this.flagType.PTR) && (typeNode.flags & this.flagType.MEMORY_STACK) === 0) {
				name += " *";
				return name;
			}
		}

		if(!isConstr) {
			name += " ";
		}

		return name;
	},

	createTemplateType: function(node)
	{
		if(!node || !node.type) {
			return "void *";
		}

		var typeNode = node.type;
		var name = typeNode.alt;

		if((typeNode.flags & this.flagType.PTR) && (typeNode.flags & this.flagType.MEMORY_STACK) === 0) {
			name += " *";
		}

		if(node.templateType) {
			name += "<" + this.createTemplateType(node.templateType) + ">";
		}

		return name;
	},	

	createDefaultValue: function(node) 
	{
		if(node.type)
		{
			var type = node.type.type;
			switch(type)
			{
				case this.type.NUMBER: return "0";
				case this.type.BOOL: return "false";
				case this.type.ARGS: return "\"\"";
				case this.type.REAL32: return "0.0f";
				case this.type.TEMPLATE: return this.createDefaultValue(node.templateType);
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

		var arg = null;
		var numArgs = args.length;
		for(var n = 0; n < numArgs; n++) {
			arg = args[n];
			this.argLookup[arg.exprType].call(this, arg, cache);
		}

		var output = "\"" + cache.format.slice(1) + "\\n\"" + cache.args;

		return output;
	},

	outputArgNumber: function(node, cache, index) 
	{
		cache.format += " %.17g";

		if(node.outputValue === Math.floor(node.outputValue)) {
			cache.args += ", " + node.outputValue + ".0";
		}
		else {
			cache.args += ", " + node.outputValue;
		}
	},

	outputArgString: function(node, cache) {
		cache.format += " " + node.outputValue;
	},

	outputArgBool: function(node, cache) 
	{
		cache.format += " %s";		

		if(node.outputValue === 1) {
			cache.args += ", \"true\"";
		}
		else {
			cache.args += ", \"false\"";
		}
	},

	outputArgRef: function(node, cache) 
	{
		var type = node.type.nativeType;
		if(type === this.type.REAL64 || type === this.type.REAL32) {
			cache.args += ", " + this.parseRef(node);
			cache.format += " %.16g";
		}
		else if(type === this.type.STRING) {
			cache.args += ", " + this.parseRef(node) + " + dopple::STR_HEADER_SIZE";
			cache.format += " %s";			
		}
		else if(type === this.type.BOOL) {
			cache.args += ", " + this.parseRef(node) + " ? \"true\" : \"false\"";
			cache.format += " %s";
		}		
	},

	outputArgFuncCall: function(node, cache) 
	{
		var type = node.type.nativeType;
		if(type === this.type.REAL64 || type === this.type.REAL32) {
			cache.args += ", " + this.parseFuncCall(node);
			cache.format += " %.16g";
		}
		else if(type === this.type.STRING) {
			cache.args += ", " + this.parseFuncCall(node) + " + dopple::STR_HEADER_SIZE";
			cache.format += " %s";			
		}
		else if(type === this.type.BOOL) {
			cache.args += ", " + this.parseFuncCall(node) + " ? \"true\" : \"false\"";
			cache.format += " %s";
		}	
	},

	createTypeArgs: function(args, index)
	{
		var mainArg = args[index];
		var numArgs = args.length;

		var output = this.tabs + this.createType(mainArg);
		var genVarName = this.scope.genVar(args[index]);

		var arg;
		var argOutput = "";
		for(var n = 0; n < numArgs - 1; n++) {
			arg = args[n];
			argOutput += this.lookup[arg.exprType].call(this, arg) + ", ";
		}
		arg = args[n];
		argOutput += this.lookup[arg.exprType].call(this, arg);

		var numItems = numArgs - index;
		output += genVarName + "[" + numItems + "] = { " + argOutput + " };\n";
		this.scope.cache.preOutput += output;
	
		return genVarName + ", " + numItems;
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

	Flag: {
		PARSING_ARGS: 1
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

	types: null,
	typeVars: null
};
