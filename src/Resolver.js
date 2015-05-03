"use strict";

dopple.Resolver = function(scope) 
{
	this.optimizer = new dopple.Optimizer();

	this.lookup = null;
	this.type = dopple.Type;
	this.flagType = dopple.Flag;

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
		nodeValue = this.resolveValue(nodeValue);
		node.value = nodeValue;
		node.cls = nodeValue.cls;
		node.flags |= this.flagType.RESOLVED;
		node.flags |= (nodeValue.flags & this.flagType.PTR);

		var expr = this.scope.vars[node.name];
		if(!expr) {
			this.scope.vars[node.name] = node;	
		}
		else 
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
		node.value = nodeValue;
		node.cls = nodeValue.cls;
		node.flags |= this.flagType.RESOLVED;
		node.flags |= (nodeValue.flags & this.flagType.PTR);

		var expr = this.getRef(node);

		var assignExpr = this.resolveAssignType(expr, node);
		if(assignExpr) {
			return assignExpr;
		}	

		return node;
	},	

	resolveAssignType: function(expr, node)
	{
		if(expr.cls) 
		{
			if(expr.cls !== node.cls) {
				throw "Incompatible type for " + node.name + " assignement";
			}
			else {
				var assignExpr = new dopple.AST.Assign(node.name, node.value, "=");
				assignExpr.flags |= this.flagType.RESOLVED;
				return assignExpr;
			}
		}
		else if(node.cls) 
		{
			if(node.flags & this.flagType.PTR) {
				expr.cls = node.cls;
			}
			else {
				throw "Incompatible type for " + node.name + " assignment";
			}
		}

		return null;
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

	resolveRef: function(node) 
	{
		node.value = this.getRefEx(node);

		if(node.type === this.type.NEW) {
			node.cls = node.value;
		}
		else if(node.type === this.type.FUNCTION_CALL) {
			this.resolveFuncCall(node);
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
		else if(node instanceof dopple.AST.Unary) {
			node.value = this.resolveValue(node.value);
			node.cls = this.global.vars.Boolean;
		}
		else if((node.flags & this.flagType.KNOWN) === 0) {
			this.resolveRef(node);
		}			
		
		return node;		
	},

	resolveClass: function(node) {
		this.resolveScope(node.scope);
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

	//
	numCls: null,
	strCls: null
};
