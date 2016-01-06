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
			if(node.flags & dopple.Flag.INTERNAL_TYPE) { continue; }
			if(!node.cls) { continue; }

			switch(node.cls.subType)
			{
				case this.subType.NUMBER:
					nodeOutput = this.parseNumber(node);
					break;

				case this.subType.BOOL:
					nodeOutput = this.parseBool(node);
					break;

				case this.subType.STRING:
					nodeOutput = this.parseString(node);
					break;

				case this.subType.FUNCTION:
					nodeOutput = this.parseFunc(node);
					break;

				case this.subType.CLASS:
					nodeOutput = this.parseCls(node);
					break;

				case this.subType.OBJECT_DEF: 
					nodeOutput = this.parseObjDef(node);
					break;

				case this.subType.ARRAY:
					nodeOutput = this.parseArray(node);
					break;

				case this.subType.SETTER_GETTER:
					nodeOutput = this.parseSetterGetter(node);
					break;

				case this.subType.OBJECT:
					nodeOutput = this.parseObj(node);
					break;
			}

			if(nodeOutput) {
				output[key] = nodeOutput;
				nodeOutput = null;
			}
			else {
				output[key] = "TODO";
			}
		}

		return output;
	},

	parseNumber: function(node)
	{
		var output = {
			type: node.cls.id,
			value: node.value
		};

		return output;
	},

	parseBool: function(node)
	{
		var output = {
			type: node.cls.id,
			value: node.value
		};

		return output;
	},

	parseString: function(node)
	{
		var output = {
			type: node.cls.id,
			value: node.value
		};

		return output;
	},

	parseFunc: function(node)
	{
		var output = {
			type: node.cls.id,
			value: "func"
		};

		return output;
	},

	parseCls: function(node)
	{
		var output = {
			type: node.cls.id,
			vars: this.parseBody(node.scope)
		};

		return output;
	},

	parseObjDef: function(node)
	{
		var value = this.parseBody(node.scope);

		var output = {
			type: node.cls.id,
			value: value
		};

		return output;		
	},

	parseArray: function(node)
	{
		var output = {
			type: node.cls.id,
			value: []
		};

		return output;	
	},

	parseSetterGetter: function(node)
	{
		var output = {
			type: node.cls.id,
			setter: (node.setter) ? true : false,
			getter: (node.getter) ? true : false
		};

		return output;	
	},

	parseObj: function(node)
	{
		var output;

		if(node.exprType === this.exprType.NULL) 
		{
			output = {
				type: node.cls.id,
				value: null
			};
		}
		else 
		{
			output = {
				type: node.cls.id,
				value: this.parseBody(node.scope)
			};
		}

		return output;
	},

	addTypeDef: function()
	{
		this.output["__type__"] = this.types;
	},

	//
	scope: null,
	globalScope: null,
	output: null,

	types: dopple.types,
	subType: dopple.SubType,
	exprType: dopple.ExprType
};
