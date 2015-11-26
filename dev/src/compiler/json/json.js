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
		var buffer = scope.vars;
		for(var key in buffer)
		{
			node = buffer[key];

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

				case this.type.OBJECT_DEF: 
					nodeOutput = this.parseObjDef(node);
					break;

				case this.type.ARRAY:
					nodeOutput = this.parseArray(node);
					break;

				case this.type.SETTER_GETTER:
					nodeOutput = this.parseSetterGetter(node);
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
			vars: this.parseBody(node.scope)
		};

		return output;
	},

	parseObjDef: function(node)
	{
		var value = this.parseBody(node.value.scope);

		var output = {
			type: this.type.OBJECT,
			value: value
		};

		return output;		
	},

	parseArray: function(node)
	{
		var output = {
			type: node.type.id,
			value: []
		};

		return output;	
	},

	parseSetterGetter: function(node)
	{
		var output = {
			type: node.type.id,
			setter: (node.setter) ? true : false,
			getter: (node.getter) ? true : false
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
