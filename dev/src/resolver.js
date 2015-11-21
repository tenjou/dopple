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
		if(!this.scope.vars) {
			this.scope.vars = {};
		}

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

				case this.exprType.SETTER:
					this.resolveSetter(node);
					break;
				case this.exprType.GETTER:
					this.resolveGetter(node);
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

	//
	scope: null,
	globalScope: null,

	type: dopple.Type,
	exprType: dopple.ExprType
};
