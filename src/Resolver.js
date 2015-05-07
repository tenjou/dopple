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
	},

	do: function() 
	{
		this.numCls = this.global.vars.Number;
		this.strCls = this.global.vars.String;

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
		else if(nodeValue)
		{
			var assignExpr = this.resolveAssignType(expr, node);
			if(assignExpr) {
				return assignExpr;
			}	
		}			

		return node;
	},

	resolveAssign: function(node)
	{
		var nodeValue = node.value;
		nodeValue = this.resolveValue(nodeValue);
		node.inheritFrom(nodeValue);

		var expr = this.getRef(node);
		var assignExpr = this.resolveAssignType(expr, node);
		if(assignExpr) {
			node = assignExpr;
		}
		else {
			node.value = nodeValue;
		}

		return node;
	},	

	resolveAssignType: function(expr, node)
	{
		var assignExpr = new dopple.AST.Assign(node.name, node.parents, node.value, "=");
		assignExpr.inheritFrom(node.value);

		if(expr.cls) 
		{
			if(expr.cls !== node.cls) {
				throw "Incompatible type for " + node.name + " assignement";
			}
		}
		else {
			expr.inheritFrom(assignExpr);
		}

		return assignExpr;
	},

	resolveIf: function(node) {
		node.value = this.resolveValue(node.value);
		this.resolveScope(node.scope);
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

		var returns = node.scope.returns;
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
		 
		var param, arg;
		var params = node.value.params;
		var args = node.args;
		var numParams = params ? params.length : 0;
		var numArgs = args ? args.length : 0;

		if(numArgs > numParams) 
		{
			throw "Passed too many arguments for " + 
				node.name + ": passed " + numArgs + " but expected " + numParams;
		}

		for(var n = 0; n < numArgs; n++) 
		{
			param = params[n];
			arg = this.resolveValue(args[n]);

			if(param.cls && param.cls !== arg.cls) 
			{
				throw "TypeError: #" + (n + 1) + " argument can not be casted from " + 
					arg.cls.name + " to " + param.cls.name + " type";
			}

			param.cls = arg.cls;
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

		if(!this.scope.returns) {
			this.scope.returns = [ node.value ];
		}
		else {
			this.scope.returns.push(node.value);
		}	

		node.flags |= this.flagType.RESOLVED;
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
			if(cls !== bufferNode.cls) 
			{
				if(!(bufferNode instanceof this.ast.Null) || 
				     value.flags & this.flagType.PTR === 0) 
				{
					throw "Type does not match: expected [" 
						+ this.createType(value) + "] but got [" + this.createType(bufferNode) + "]";					
				}
			}
		}

		node.templateValue = value;

		return node;
	},

	resolveRef: function(node) 
	{
		node.value = this.getRefEx(node);

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
			var leftCls = this.resolveValue(node.lhs).cls;
			var rightCls = this.resolveValue(node.rhs).cls;

			if(leftCls !== rightCls)
			{
				if(leftCls === this.numCls && rightCls === this.strCls) {
					node.cls = this.strCls;
				}
				else if(leftCls === this.strCls && rightCls === this.numCls) {
					node.cls = this.strCls;
				}
				else {
					throw "TypeError: Can not cast value from " + 
						leftCls.name + " to " + rightCls.name + " type";
				}
			}
			else {
				node.cls = leftCls;
			}		
		}
		else if(node instanceof this.ast.Unary) {
			node.value = this.resolveValue(node.value);
			node.cls = this.global.vars.Boolean;
		}
		else if(node instanceof this.ast.Array) {
			this.resolveArray(node);
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

		var num = constrBuffer.length;
		for(var n = 0; n < num; n++) 
		{
			constr = constrBuffer[n];
			params = constr.params;
			numParams = params ? params.length : 0;

			if(numArgs > numParams) { continue; }

			// Validate arguments:
			for(i = 0; i < numArgs; i++)
			{
				param = params[i];
				arg = this.resolveValue(args[i]);

				if(param.cls && param.cls !== arg.cls) 
				{
					throw "TypeError: #" + (n + 1) + " argument can not be casted from " + 
						arg.cls.name + " to " + param.cls.name + " type";
				}

				param.cls = arg.cls;
			}

			node.func = constr;			
		}

		if(!node.func) {
			throw "Could not find matching constructor for: " + node.cls.name;		
		}

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

		if(expr.type === this.type.VAR) {
			return expr.value;
		}

		return expr;		
	},

	getRef: function(node) 
	{
		var ref = null;
		var name = node.name;
		var scope = node.scope;
		var parents = node.parents;

		if(parents) 
		{
			var expr = this.getRefName(node.parents[0]);
			if(expr instanceof dopple.AST.Var) {
				scope = expr.cls.scope;
			}
			else if(expr instanceof dopple.AST.Class) {
				scope = expr.scope;
			}

			ref = scope.vars[node.name];

			return ref;
		}
		
		return this.getRefName(node.name);
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

		return ref;	
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
	strCls: null
};