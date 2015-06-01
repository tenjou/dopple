"use strict";

dopple.Resolver = function(scope) 
{
	this.optimizer = new dopple.Optimizer();

	this.lookup = null;
	this.type = dopple.Type;
	this.types = dopple.types;
	this.typesVars = dopple.typeVars;
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
		this.lookup[this.type.REFERENCE] = this.resolveRef;
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
		this.typeVars = dopple.typeVars;

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
			body[n] = this.lookup[node.exprType].call(this, node);
		}

		this.scope = prevScope;
	},

	resolveVar: function(node) 
	{
		if(node.value) {
			node.inheritFrom(this.resolveValue(node.value));
		}
		else {
			node.inheritFrom(this.typeVars.VoidPtr);
			node.flags |= this.flagType.HIDDEN;
		}

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
		if(!branch.value.cls) {
			throw "Branch expression does not return any value."
		}
		this.resolveScope(branch.scope);

		if(node.branchElseIf)
		{
			var branches = node.branchElseIf;
			var num = branches.length;
			for(var n = 0; n < num; n++) {
				branch = branches[n];
				branch.value = this.resolveValue(branch.value);
				if(!branch.value.cls) {
					throw "Branch expression does not return any value."
				}				
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
			var type = value.type;
			var num = returns.length;
			for(var n = 1; n < num; n++) 
			{
				if(type.type !== returns[n].type.type) {
					throw "Types do not match for function return values: expected [" 
							+ this.createType(value) + "] but got [" 
							+ this.createType(returns[n]) + "]";	
				}
			}

			node.value = value;
		}
		else {
			node.value = this.typeVars.Void;
		}

		node.inheritFrom(node.value);
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
		
		var numArgsResolve;
		if(func.argsIndex > -1) {
			numArgsResolve = func.argsIndex;
		}	
		else {
			numArgsResolve = numArgs;
		}

		if(numArgsResolve > numParams) {
			throw "Passed too many arguments for " + 
				node.name + ": passed " + numArgsResolve + " but expected " + numParams;				
		}

		var parent = null;
		for(var n = 0; n < numArgsResolve; n++) 
		{
			param = params[n];
			arg = this.resolveValue(args[n]);
			if(!this.checkTypes(param, arg)) 
			{
				throw "Types do not match for #" + n + " argument: expected [" 
						+ this.createType(param) + "] but got [" 
						+ this.createType(arg) + "]";	
			}
		}

		for(; n < numArgs; n++) {
			arg = this.resolveValue(args[n]);
			if(arg.type.type === 0) {
				throw "Function call argument #" + n + " should return a value";
			}
		}

		this.resolveFunc(node.value);

		node.inheritFrom(node.value);

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
			node.cls = this.global.vars.Real64;
		}

		return node;
	},

	resolveArray: function(node)
	{
		var elements = node.elements;
		if(!node.elements) { return node; }

		var num = elements.length;

		var bufferNode = this.resolveValue(elements[0]);
		var value = bufferNode;
		var type = bufferNode.type;

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

		node.templateType = node.type.createTemplate(value);

		return node;
	},

	checkTypes: function(leftNode, rightNode)
	{
		var leftTypeNode = leftNode.type;
		var rightTypeNode = rightNode.type;

		if(!rightTypeNode) {
			throw "Trying to assign an undefined variable: \"" + rightNode.name + "\"";
		}

		if(leftTypeNode && leftTypeNode.type !== 0)
		{
			var leftType = leftTypeNode.type;

			if(leftTypeNode.flags & this.flagType.ARGS) {}
			else if(leftTypeNode.type === this.type.NULL) 
			{
				if((leftNode.flags & this.flagType.PTR) === 0) {
					return false;
				}

				leftNode.inheritFrom(rightNode);
			}			
			else if(leftTypeNode !== rightTypeNode)
			{
				var rightType = rightTypeNode.type;

				if(leftType === this.type.STRING && rightType === this.type.NUMBER) {
					leftNode.inheritFrom(rightNode);
				}
				else if(leftType === this.type.NUMBER && rightType === this.type.NUMBER) {
					return true;
				}
				else {
					return false;
				}
			}
			else if((leftTypeNode.flags & this.flagType.TEMPLATE) && 
				    (rightTypeNode.flags & this.flagType.TEMPLATE))
			{
				if(!leftNode.templateType) {
					return true;
				}
				
				return this.checkTypes(leftNode.templateType.type, rightNode.templateType.type);
			}
		}
		else {
			leftNode.inheritFrom(rightNode);			
		}

		return true;		
	},

	resolveValue: function(node)
	{
		if(node.flags & this.flagType.KNOWN) { return node; }

		if(node instanceof this.ast.Reference) {
			node.value = this.getRefEx(node);
			node.inheritFrom(node.value);
		}
		else if(node instanceof this.ast.New) {
			node.value = this.getRefEx(node);
			node.inheritFrom(node.value);
			this.resolveNew(node);
		}
		else if(node instanceof this.ast.FunctionCall) {
			this.resolveFuncCall(node);
		}
		else if(node instanceof this.ast.Binary) 
		{
			var leftValue = this.resolveValue(node.lhs);
			var rightValue = this.resolveValue(node.rhs);
			if(!this.checkTypes(leftValue, rightValue)) 
			{
				throw "Types do not match for \"" + leftValue.name + "\" binary operation: expected [" 
						+ this.createType(leftValue) + "] but got [" 
						+ this.createType(rightValue) + "]";					
			}

			node.inheritFrom(leftValue);
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
		else if(node instanceof this.ast.Function) 
		{
			if(!node.name) {
				node.name = this.global.genFunc();
				this.resolveFunc(node);
			}
			else {
				this.resolveRef(node);
			}
		}		
		
		return node;		
	},

	resolveClass: function(node) {
		this.resolveScope(node.scope);
	},	

	resolveNew: function(node)
	{
		var args = node.args;
		var numArgs = args ? args.length : 0;

		var params = null;
		var numParams = 0;

		var param, arg, constr, i;
		var constrBuffer = node.value.constrBuffer;
		if(!constrBuffer) {
			throw "TypeError: object is not a function: " + node.name;
		}

		for(var n = 0; n < numArgs; n++) {
			args[n] = this.resolveValue(args[n]);
		}

		var currNumArgs;
		var valid = false;
		var num = constrBuffer.length;
		for(n = 0; n < num; n++) 
		{
			constr = constrBuffer[n];
			currNumArgs = numArgs;

			if(constr.minParams > -1 && currNumArgs < constr.minParams) { continue; }

			params = constr.params;
			numParams = params ? params.length : 0;
			
			if(constr.argsIndex > -1) {
				currNumArgs = constr.argsIndex;
			}	

			if(currNumArgs > numParams) { continue; }
	
			valid = true;
			for(i = 0; i < currNumArgs; i++) {
				param = params[i];
				arg = args[i];
				if(!this.checkTypes(param, arg)) {
					valid = false;
					break;
				}
			}

			if(valid) 
			{
				if(numParams > 0)
				{
					var paramType = params[0].type.type;
					if(paramType === this.type.TYPE_ARGS) {
						this.resolveTypeArgs(args, i);
					}
				}

				node.func = constr;
				break;
			}
		}

		if(!node.func) {
			throw "Could not find matching constructor for: " + node.type.name;
		}

		if(node.flags & this.flagType.TEMPLATE) 
		{
			if(numArgs > 0) {
				node.templateType = node.type.createTemplate(args[0]);
			}
			else {
				node.templateType = node.type.createTemplate(null);
			}
		}

		return node;
	},

	resolveTypeArgs: function(args, index)
	{
		var arg;
		var mainArg = args[index];
		var num = args.length;
		for(var i = index + 1; i < num; i++)
		{
			arg = args[i];
			if(arg.type !== mainArg.type) 
			{
				throw "Types do not match for arguments: expected [" 
						+ this.createType(mainArg) + "] but got [" 
						+ this.createType(arg) + "]";					
			}
		}
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
			if(expr.type.exprType === this.type.NULL) {
				throw "ReferenceError: " + node.parents[0] + " has unknown type";
			}

			if(expr instanceof this.ast.Mutator) 
			{
				scope = expr.scope;

				if((expr.flags & this.flagType.GETTER) === 0) {
					throw "Assign not possible - mutator \"" + node.name + "\" does not own a getter";
				}
				else {
					node.flags |= this.flagType.GETTER;
				}
			}

			scope = expr.scope;
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

	createType: function(node, isConstr)
	{
		if(!node || !node.type) {
			return "void *";
		}	

		var typeNode = node.type;
		var name = typeNode.name;

		if(node.templateType) {
			name += "<" + this.createTemplateType(node.templateType) + ">";
		} 

		return name;
	},

	createTemplateType: function(node)
	{
		if(!node || !node.type) {
			return "void *";
		}

		var typeNode = node.type;
		var name = typeNode.name;

		if(node.templateType) {
			name += "<" + this.createTemplateType(node.templateType) + ">";
		}

		return name;
	},

	//
	typeVars: null
};
