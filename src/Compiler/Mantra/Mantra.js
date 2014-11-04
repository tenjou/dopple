"use strict";

Compiler.Mantra = Compiler.Core.extend
({
	make: function()
	{
		this.output = [];

		var item, exprType;
		var numItems = this.global.length;
		for(var i = 0; i < numItems; i++)
		{
			item = this.global[i];
			exprType = item.exprType;

			switch(exprType)
			{
				case ExprEnum.VAR:
					this.makeVar(item);
					break;
			}
		}

		return this.output;
	},

	makeVar: function(item)
	{
		this.output += "var " + item.name;
	}
});