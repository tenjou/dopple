"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;

		// try {
		 	this.resolveBody(scope.body);
		// }
		// catch(error) {
		// 	console.error(error);
		// }
	},

	resolveBody: function(nodes)
	{
		var node;
		var num = nodes.length;
		for(var n = 0; n < num; n++)
		{
			node = nodes[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.exprType.VAR:
					this.resolveVar(node);
					break;

				case this.exprType.STRING:
				case this.exprType.NUMBER:
					nodes[n] = null;
					break;

				case this.exprType.ASSIGN:
					this.resolveAssing(node);
					break;

				case this.exprType.SETTER:
					this.resolveSetter(node);
					break;
				case this.exprType.GETTER:
					this.resolveGetter(node);
					break;

				case this.exprType.FUNCTION:
					this.resolveFunc(node);
					break;

				case this.exprType.MEMBER:
					this.resolveMember(node);
					break;

				case this.exprType.CLASS:
					this.resolveClass(node);
					break;
			}
		}
	},

	resolveVar: function(node)
	{
		if(this.scope.vars[node.name]) {
			throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
		}

		node.value = dopple.optimizer.do(node.value);

		var value = node.value;
		switch(value.exprType)
		{
			case this.exprType.OBJECT:
				this.resolveObj(value);
				break;
		}

		node.type = node.value.type;

		this.scope.vars[node.name] = node;
	},

	resolveAssing: function(node)
	{
		var prevScope = this.scope;

		var name = this.setupParentScope(node.lhs);
		var varExpr = this.scope.vars[name];

		var refExpr;
		var rhsExprType = node.rhs.exprType;
		switch(rhsExprType)
		{
			case this.exprType.OBJECT:
			{
				var type = dopple.extern.addType(name, this.subType.CLASS, null);
				type.scope = node.rhs.scope;

				// convert from function to class:
				if(varExpr)
				{
				   if(varExpr.exprType === this.exprType.REFERENCE && 
					  varExpr.value && varExpr.value.exprType === this.exprType.FUNCTION)
					{
						var funcBody = varExpr.value.scope.body;
						type.scope.body.concat(funcBody);
					}
					else {
						throw "Redefinition: \"" + name + "\" is already defined in this scope";
					}
				}

				refExpr = new dopple.AST.Reference(null, type);
			} break;

			case this.exprType.FUNCTION:
			{
				refExpr = new dopple.AST.Reference(null, node.rhs.type, node.rhs);
			} break;

			default:
				console.log("todo");
				break;
		}

		this.scope.vars[name] = refExpr;
		this.scope = prevScope;
	},

	resolveObj: function(node)
	{
		var rootScope = this.scope;
		this.scope = node.scope;

		this.resolveBody(this.scope.body);

		this.scope = rootScope;
	},

	resolveSetter: function(node)
	{
		var expr = this.scope.vars[node.name];

		// if there is already defined expr with such name:
		if(expr)
		{	
			if(expr.exprType !== this.exprType.SETTER_GETTER) {
				throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
			}

			expr.setter = node.value;
		}
		else
		{
			var setGetExpr = new dopple.AST.SetterGetter(node.name, node.value, null);
			this.scope.vars[node.name] = setGetExpr;
		}
	},

	resolveGetter: function(node)
	{
		var expr = this.scope.vars[node.name];

		// if there is already defined expr with such name:
		if(expr)
		{	
			if(expr.exprType !== this.exprType.SETTER_GETTER) {
				throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
			}

			expr.getter = node.value;
		}
		else
		{
			var setGetExpr = new dopple.AST.SetterGetter(node.name, null, node.value);
			this.scope.vars[node.name] = setGetExpr;
		}
	},

	resolveFunc: function(node)
	{
		return node;
	},

	resolveMember: function(node)
	{


		return node;
	},

	resolveClass: function(node)
	{
		var expr, name;
		var scope = this.globalScope;
		var path = node.name.split(".");
		var num = path.length - 1;
		for(var n = 0; n < num; n++)
		{
			name = path[n];
			expr = scope.vars[name];
			if(!expr) {
				var objScope = new dopple.Scope(scope);
				var objExpr = new dopple.AST.Object(objScope);
				expr = new dopple.AST.Var(name, objExpr);
				scope.vars[name] = expr;
			}

			scope = expr.value.scope;
		}

		name = path[num];
		expr = scope.vars[name];
		if(expr) {
			throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
		}

		scope.vars[name] = node;
	},

	setupParentScope: function(node)
	{
		if(node.valueExpr.exprType !== this.exprType.MEMBER) 
		{
			var name = node.valueExpr.name;
			var expr = this.scope.vars[name];
			if(!expr) {
				throw "ReferenceError: " + name + " is not defined";
			}

			this.scope = expr.value.scope;

			return node.nameExpr.name;
		}
		else 
		{
			var name = this.setupParentScope(node.valueExpr);
			if(node.nameExpr.name === "prototype") {
				return name;
			}

			var expr = this.scope.vars[name];
			if(!expr) {
				throw "ReferenceError: " + name + " is not defined";
			}

			var exprType = expr.exprType;
			if(exprType === this.exprType.CLASS) {
				this.scope = expr.scope;
			}
			else {
				this.scope = expr.value.scope;
			}
			
			return name;
		}
	},

	//
	scope: null,
	globalScope: null,

	exprType: dopple.ExprType,
	subType: dopple.SubType
};
