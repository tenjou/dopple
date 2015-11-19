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
			this.scope.varsBuffer = [];
		}

		var node;
		var num = nodes.length;
		for(var n = 0; n < num; n++)
		{
			node = nodes[n];
			if(!node) { continue; }

			switch(node.exprType)
			{
				case this.type.VAR:
					this.resolveVar(node);
					break;

				case this.type.STRING:
				case this.type.NUMBER:
					nodes[n] = null;
					break;
			}
		}
	},

	resolveVar: function(node)
	{
		if(this.scope.vars[node.name]) {
			throw "Redefinition: \"" + node.name + "\" is already defined in this scope";
		}

		var value = node.value;
		switch(value.exprType)
		{
			case this.type.OBJECT:
				this.resolveObj(value);
				break;
		}

		node.type = node.value.type;

		this.scope.vars[node.name] = node;
		this.scope.varsBuffer.push(node);
	},

	resolveObj: function(node)
	{
		var rootScope = this.scope;
		this.scope = node.scope;

		this.resolveBody(this.scope.body);

		this.scope = rootScope;
	},

	//
	scope: null,
	globalScope: null,
	type: dopple.ExprType
};
