"use strict";

dopple.compiler.json =
{
	compile: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		this.result = {};

		this.parseBody(scope.body);

		return this.result;
	},

	parseBody: function(nodes)
	{
		var num = nodes.length;
		for(var n = 0; n < num; n++)
		{
			
		}
	},

	//
	scope: null,
	globalScope: null,
	result: null	
};
