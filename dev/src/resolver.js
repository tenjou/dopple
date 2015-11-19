"use strict";

dopple.resolver = 
{
	resolve: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		this.resolveBody(scope.body);
	},

	resolveBody: function(nodes)
	{
		var num = nodes.length;
		for(var n = 0; n < num; n++)
		{
			
		}
	},

	//
	scope: null,
	globalScope: null
};
