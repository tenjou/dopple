"use strict";

dopple.Resolver = function(scope) 
{
	this.optimizer = new dopple.Optimizer();

	this.lookup = null;
	this.type = dopple.Type;
	this.flagType = dopple.Flag;
	this.ast = dopple.AST;

	this.global = scope;
	this.scope = scope;

	this.init();
};

dopple.Resolver.prototype = 
{
	init: function() 
	{
		this.lookup = [];
		this.lookup[this.type.NUMBER] = this.parseNumber;
		this.lookup[this.type.STRING] = this.parseString;
		this.lookup[this.type.REFERENCE] = this.resolveRef;
		this.lookup[this.type.BINARY] = this.parseBinary;
		this.lookup[this.type.VAR] = this.resolveVar;
		this.lookup[this.type.IF] = this.resolveIf;
		this.lookup[this.type.ASSIGN] = this.resolveAssign;
		this.lookup[this.type.FUNCTION_CALL] = this.resolveFuncCall;
		this.lookup[this.type.RETURN] = this.resolveReturn;
		this.lookup[this.type.UNARY] = this.resolveUnary;
		this.lookup[this.type.MUTATOR] = this.resolveMutator;
	},

	do: function() 
	{
		this.numCls = this.global.vars.Number;
		this.strCls = this.global.vars.String;
		this.nativeVars = dopple.nativeVars;

		this.resolveScope(this.global);
	},

	resolveScope: function(scope)
	{
		var prevScope = this.scope;
		this.scope = scope;

		var node = null;
		var newNode = null;
		var funcs = scope.funcs;
		var body = scope.body;

		var num = body.length;
		for(var n = 0; n < num; n++) {
			node = body[n];
			body[n] = this.lookup[node.type].call(this, node);
		}

		this.scope = prevScope;
	},

	resolveVar: function(node) 
	{
		var nodeValue = node.value;
		if(nodeValue) {
			nodeValue = this.resolveValue(nodeValue);
			node.value = nodeValue;
			node.inheritFrom(nodeValue);
		}
		else {
			node.flags |= this.flagType.HIDDEN;
		}

		node.flags |= this.flagType.RESOLVED;

		var expr = this.scope.vars[node.name];
		if(!expr) 
		{
			this.scope.vars[node.name] = node;

			if((node.flags & this.flagType.EXTERN) === 0) 
			{
				if(!this.scope.cache.decls) {
					this.scope.cache.decls = [ node ];
				}
				else {
					this.scope.cache.decls.push(node);
				}
			}
		}	
		else 
		{
			if(!this.checkTypes(expr, node)) 
			{
				throw "Types do not match for \"" + expr.name + "\" assignment: expected [" 
						+ this.createType(expr) + "] but got [" 
						+ this.createType(node) + "]";	
			}	
		}	

		return node;
	},

	resolveAssign: function(node)
	{
		var nodeValue = node.value;
		nodeValue = this.resolveValue(nodeValue);
		node.inheritFrom(nodeValue);

		var expr = this.getRefEx(node);
		if(!this.checkTypes(expr, node)) 
		{
			throw "Types do not match for \"" + expr.name + "\" assignment: expected [" 
					+ this.createType(expr) + "] but got [" 
					+ this.createType(node) + "]";				
		}

		if(expr instanceof this.ast.Mutator) 
		{
			if((expr.flags & this.flagType.SETTER) === 0) {
				throw "Assign not possible - mutator \"" + node.name + "\" does not own a setter";
			}
			else {
				node.flags |= this.flagType.SETTER;
			}
		}

		return node;
	},	

	resolveIf: function(node) 
	{
		var branch = node.branchIf;
		branch.value = this.resolveValue(branch.value);
		this.resolveScope(branch.scope);

		if(node.branchElseIf)
		{
			var branches = node.branchElseIf;
			var num = branches.length;
			for(var n = 0; n < num; n++) {
				branch = branches[n];
				branch.value = this.resolveValue(branch.value);
				this.resolveScope(branch.scope);
			}			
		}
		
		if(node.branchElse) {
			this.resolveScope(node.branchElse.scope);			
		}
		
		return node;
	},

	resolveConditional: function(node)
	{
		node.test = this.resolveValue(node.test);
		node.value = this.resolveValue(node.value);
		node.valueFail = this.resolveValue(node.valueFail);

		if(!this.checkTypes(node.value, node.valueFail)) {
			throw "Types do not match for conditional assignment: expected [" 
					+ this.createType(node.value) + "] but got [" 
					+ this.createType(node.valueFail) + "]";				
		}

		node.cls = node.value.cls;

		return node;
	},

	resolveFuncDef: function(node)
	{	
		var ref = this.scope.vars[node.name];
		if(ref) {
			throw "Redefinition: " + node.name + " is already defined in this scope";
		}

		var func = node.value;
		func.type = this.type.FUNCTION;
		func.name = node.name;
		this.scope.vars[node.name] = func;
		return func;
	},

	resolveClassDef: function(node)
	{
		var cls = new dopple.AST.Class(node.name, node.value.scope);
		cls.global = true;
		this.resolveClass(cls);

		this.scope.vars[cls.name] = cls;
		this.scope.classes.push(cls);
	},

	resolveFunc: function(node)
	{
		if(node.flags & this.flagType.RESOLVED) { return; }

		this.resolveScope(node.scope);

		// TODO: Check if all control paths returns a value.
		var returns = node.scope.cache.returns;
		if(returns)
		{
			var value = returns[0];
			var cls = value.cls;
			var num = returns.length;
			for(var n = 1; n < num; n++) 
			{
				if(cls !== returns[n].cls) {
					throw "mismatch";
				}
			}

			node.value = value;
			node.returnCls = cls;
			node.flags |= value.flags & this.flagType.PTR;
		}

		node.flags |= this.flagType.RESOLVED;
	},

	resolveFuncCall: function(node)
	{
		var expr = this.getRefEx(node);
		if(expr instanceof dopple.AST.Var) {
			node.value = expr.value.value;
			node.name = node.value.name;
		}
		else {
			node.value = expr;
		}

		var func = node.value;
		 
		var param, arg;
		var params = node.value.params;
		var args = node.args;
		var numParams = params ? params.length : 0;
		var numArgs = args ? args.length : 0;

		if(numArgs > numParams) 
		{
			if((func.flags & this.flagType.RESOLVED) === 0) 
			{
				var argCls = this.nativeVars.Args;
				for(var n = 0; n < numParams; n++) {
					if(params[n].cls === argCls) {
						func.argsIndex = n;
						break;
					}
				}				
			}

			if(func.argsIndex === -1)
			{
				throw "Passed too many arguments for " + 
					node.name + ": passed " + numArgs + " but expected " + numParams;
			}
		}

		if(func.argsIndex > -1) {
			numParams = func.argsIndex;
		}

		var parent = null;
		for(var n = 0; n < numArgs; n++) 
		{
			param = params[n];
			arg = this.resolveValue(args[n]);
			if(!this.checkTypes(param, arg)) 
			{
				throw "Types do not match for " + n + " argument: expected [" 
						+ this.createType(param) + "] but got [" 
						+ this.createType(arg) + "]";	
			}
		}

		this.resolveFunc(node.value);

		node.func = node.value;
		node.cls = node.value.returnCls;
		if(node.cls === dopple.scope.vars.Function) {
			node.cls = null;
		}

		return node;
	},

	resolveReturn: function(node) 
	{
		node.value = this.resolveValue(node.value);

		var cache = this.scope.cache;
		if(!cache.returns) {
			cache.returns = [ node.value ];
		}
		else {
			cache.returns.push(node.value);
		}	

		node.flags |= this.flagType.RESOLVED;
		return node;	
	},

	resolveUnary: function(node)
	{
		node.value = this.resolveValue(node.value);

		if(node.op === "!") {
			node.cls = this.global.vars.Boolean;
		}
		else {
			node.cls = this.global.vars.Number;
		}

		return node;
	},

	resolveArray: function(node)
	{
		var elements = node.elements;
		if(!node.elements) { return null; }

		var bufferNode = null;
		var cls = null;
		var value = null;
		var num = elements.length;

		bufferNode = elements[0];
		bufferNode = this.resolveValue(bufferNode);
		value = bufferNode;
		cls = bufferNode.cls;

		for(var n = 1; n < num; n++) 
		{
			bufferNode = elements[n];
			bufferNode = this.resolveValue(bufferNode);
			if(!this.checkTypes(value, bufferNode)) {
				throw "Types do not match for array value: expected [" 
						+ this.createType(value) + "] but got [" 
						+ this.createType(bufferNode) + "]";					
			}
		}

		if(!(value instanceof this.ast.Null)) {
			node.templateValue = value;
		}

		return node;
	},

	checkTypes: function(leftNode, rightNode)
	{
		var leftCls = leftNode.cls;
		var rightCls = rightNode.cls;

		if(leftCls) 
		{
			if(leftCls.flags & this.flagType.TEMPLATE) 
			{
				if(!leftNode.templateValue) {
					leftNode.templateValue = rightNode.templateValue;
				}
				else if(leftNode.templateValue.cls !== rightNode.templateValue.cls) {
					return false;					
				}
			}
			else if(leftCls !== rightCls) 
			{
				if(leftCls.varType === this.type.NUMBER)
				{
					if(rightCls.varType === this.type.STRING) {
						leftNode.cls = this.strCls;
					}
					else if(rightCls.varType === this.type.NUMBER) 
					{}
				}
				else if(leftCls.varType === this.type.STRING)
				{
					if(rightCls.varType === NUMBER) {
						leftNode.cls = this.strCls;
					}
				}
				if(leftCls === this.nativeVars.Args) 
				{}
				else if(leftCls === this.nativeVars.Null) {
					leftNode.cls = rightCls;
				}
				else if(!(rightNode instanceof this.ast.Null) || 
				     rightNode.flags & this.flagType.PTR === 0) 
				{				
					return false;
					// if(!leftNode.name) {
					// 	throw "Types do not match: expected [" 
					// 			+ this.createType(leftNode) + "] but got [" 
					// 			+ this.createType(rightNode) + "]";	
					// }
					// else {
					// 	throw "Types do not match for \"" + leftNode.name + "\" assignment: expected [" 
					// 			+ this.createType(leftNode) + "] but got [" 
					// 			+ this.createType(rightNode) + "]";	
					// }
				}	
			}
		}
		else {
			leftNode.cls = rightCls;
			leftNode.flags |= (rightNode.flags & this.flagType.PTR);
			leftNode.flags |= (rightNode.flags & this.flagType.MEMORY_STACK);
		}

		return true;			
	},	

	resolveRef: function(node) 
	{
		node.value = this.getRefEx(node);
		// if(expr instanceof this.ast.Var) {
		// 	node.value = node.value.value;
		// }

		if(node instanceof this.ast.New) {
			this.resolveNew(node);
		}
		else if(node instanceof this.ast.FunctionCall) {
			this.resolveFuncCall(node);
		}
		else if(node instanceof this.ast.Array) {
			this.resolveArray(node);
		}
		else {
			node.cls = node.value.cls;
		}
		
		node.flags |= (node.value.flags & this.flagType.PTR);

		return node;
	},	

	resolveValue: function(node)
	{
		if(node instanceof dopple.AST.Binary) 
		{
			var leftValue = this.resolveValue(node.lhs);
			var rightValue = this.resolveValue(node.rhs);
			if(!this.checkTypes(leftValue, rightValue)) 
			{
				throw "Types do not match for \"" + leftValue.name + "\" binary operation: expected [" 
						+ this.createType(leftValue) + "] but got [" 
						+ this.createType(rightValue) + "]";					
			}
			node.cls = leftValue.cls;
		}
		else if(node instanceof this.ast.Unary) {
			this.resolveUnary(node);
		}
		else if(node instanceof this.ast.Array) {
			this.resolveArray(node);
		}		
		else if(node instanceof this.ast.Conditional) {
			this.resolveConditional(node);
		}
		else if((node.flags & this.flagType.KNOWN) === 0) {
			this.resolveRef(node);
		}			
		
		return node;		
	},

	resolveClass: function(node) {
		this.resolveScope(node.scope);
	},	

	resolveNew: function(node)
	{
		node.cls = node.value;

		var args = node.args;
		var numArgs = args ? args.length : 0;

		var params = null;
		var numParams = 0;

		var param, arg, constr, i;
		var constrBuffer = node.value.constrBuffer;
		if(!constrBuffer) {
			throw "Could not find matching constructor for: " + node.cls.name;
		}

		var valid;
		var num = constrBuffer.length;
		for(var n = 0; n < num; n++) 
		{
			constr = constrBuffer[n];
			params = constr.params;
			numParams = params ? params.length : 0;

			if(numArgs > numParams) { continue; }

			valid = true;

			// Validate arguments:
			for(i = 0; i < numArgs; i++) {
				param = params[i];
				arg = this.resolveValue(args[i]);
				if(!this.checkTypes(param, arg)) {
					valid = false;
					break;
				}
			}

			if(valid) {
				node.func = constr;
				break;
			}
		}

		if(!node.func) {
			throw "Could not find matching constructor for: " + node.cls.name;		
		}

		node.flags |= node.cls.flags & this.flagType.MEMORY_STACK;

		return node;
	},

	resolveMutator: function(node) 
	{
		var ref = this.getRef(node);
		if(ref) {
			throw "Redefinition: " + node.name + " is already defined in this scope";
		}

		this.scope.vars[node.name] = node;

		return node;
	},

	convertToClass: function(node) 
	{
		var cls = new dopple.AST.Class(node.name, node.scope);
		cls.constr = node;
		node.scope = new dopple.Scope(node.scope);
		this.resolveClass(cls);
		return cls;
	},

	getRefEx: function(node)
	{
		var expr = this.getRef(node);
		if(!expr) {
			throw "ReferenceError: " + node.name + " is not defined";
		}

		return expr;		
	},

	getRef: function(node) 
	{
		var expr = null;
		var name = node.name;
		var parents = node.parents;

		if(parents) 
		{
			var scope = null;
			expr = this.getRefName(node.parents[0]);
			if(!expr) { 
				throw "ReferenceError: " + node.parents[0] + " is not defined";
			}
			if(!expr.cls || expr.cls.clsType === this.type.NULL) {
				throw "ReferenceError: " + node.parents[0] + " has unknown type";
			}

			if(expr instanceof dopple.AST.Var) {
				scope = expr.cls.scope;
			}
			else if(expr instanceof dopple.AST.Class) {
				scope = expr.scope;
			}
			else if(expr instanceof this.ast.Mutator) 
			{
				scope = expr.scope;

				if((expr.flags & this.flagType.GETTER) === 0) {
					throw "Assign not possible - mutator \"" + node.name + "\" does not own a getter";
				}
				else {
					node.flags |= this.flagType.GETTER;
				}
			}
			else {
				scope = expr.scope;
			}			

			node.parent = expr;

			return scope.vars[name];
		}

		return this.getRefName(name);
	},

	getRefName: function(name)
	{
		var ref = null;
		var scope = this.scope;

		while(scope) 
		{
			ref = scope.vars[name];
			if(ref) { return ref; }

			scope = scope.parent;
		}

		return null;	
	},

	createType: function(node)
	{
		if(!node || !node.cls) {
			return "void *";
		}

		var name = node.cls.name;

		if(node.cls.flags & this.flagType.TEMPLATE) {
			name += "<" + this.createTemplateType(node) + ">";
		}			

		if(node.flags & this.flagType.PTR) {
			name += " *";
		}

		return name;
	},	

	createTemplateType: function(node)
	{
		if(!node || !node.templateValue) {
			return "void *";
		}

		var name = node.templateValue.cls.name;		

		if(node.templateValue.flags & this.flagType.PTR) {
			name += " *";
		}

		if(node.templateValue.value.templateValue) {
			name += "<" + this.createTemplateType(node.templateValue.value) + ">";
		}

		return name;
	},	

	//
	numCls: null,
	strCls: null,
	nativeVars: null
};
