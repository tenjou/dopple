"use strict";

dopple.compiler.json =
{
	compile: function(scope)
	{
		this.scope = scope;
		this.globalScope = scope;
		this.output = {};

		this.output = this.parseBody(scope);

		this.addTypeDef();

		return this.output;
	},

	parseBody: function(scope)
	{
		var output = {};

		var node;
		var nodeOutput = null;
		var buffer = scope.varsBuffer;
		var num = buffer.length;
		for(var n = 0; n < num; n++)
		{
			node = buffer[n];

			switch(node.type)
			{
				case this.type.NUMBER:
					nodeOutput = this.parseNumber(node);
					break;

				case this.type.BOOL:
					nodeOutput = this.parseBool(node);
					break;

				case this.type.STRING:
					nodeOutput = this.parseString(node);
					break;

				case this.type.CLASS:
					nodeOutput = this.parseCls(node);
					break;

				case this.type.OBJECT: 
					nodeOutput = this.parseObj(node);
					break;

				case this.type.ARRAY:
					nodeOutput = this.parseArray(node);
					break;
			}

			if(nodeOutput) {
				output[node.name] = nodeOutput;
				nodeOutput = null;
			}
			else {
				output[node.name] = "TODO";
			}
		}

		return output;
	},

	parseNumber: function(node)
	{
		var output = {
			type: this.type.NUMBER,
			value: node.value.value
		};

		return output;
	},

	parseBool: function(node)
	{
		var output = {
			type: this.type.BOOL,
			value: node.value.value
		};

		return output;
	},

	parseString: function(node)
	{
		var output = {
			type: this.type.STRING,
			value: node.value.value
		};

		return output;
	},

	parseCls: function(node)
	{
		var output = {
			type: this.type.CLASS,
			vars: this.parseBody(node.value.scope)
		};

		return output;
	},

	parseObj: function(node)
	{
		var value = null;

		var output = {
			type: this.type.OBJECT,
			value: value
		};

		return output;		
	},

	parseArray: function(node)
	{
		var output = {
			type: this.type.ARRAY,
			value: []
		};

		return output;	
	},

	addTypeDef: function()
	{
		var output = {};

		var keys = Object.keys(dopple.Type);
		var num = keys.length;
		for(var n = 0; n < num; n++) {
			output[n] = keys[n];
		}

		this.output["__type__"] = output;
	},

	//
	scope: null,
	globalScope: null,
	output: null,

	type: dopple.Type,
	exprType: dopple.ExprType
};
