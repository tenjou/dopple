"use strict";

dopple.extern = 
{
	loadPrimitives: function()
	{
		this.addType("unknown", dopple.SubType.UNKNOWN, dopple.AST.Var);
		this.addType("number", dopple.SubType.NUMBER, dopple.AST.Number);
		this.addType("bool", dopple.SubType.NUMBER, dopple.AST.Bool);
		this.addType("string", dopple.SubType.STRING, dopple.AST.String);
		this.addType("function", dopple.SubType.FUNCTION, dopple.AST.Function);
		this.addType("setter-getter", dopple.SubType.SETTER_GETTER, dopple.AST.SetterGetter);
		this.addType("object", dopple.SubType.OBJECT, dopple.AST.Null);
		this.addType("object-def", dopple.SubType.OBJECT_DEF, dopple.AST.Object);
		this.addType("class", dopple.SubType.CLASS, dopple.AST.Class);
		this.addType("array", dopple.SubType.ARRAY, dopple.AST.Array);
	},

	addType: function(name, subType, ast)
	{
		var type = new dopple.AST.Type(this.types.length, name, subType);
		this.types.push(type);

		if(ast) {
			ast.prototype.type = type;
		}

		return type;
	},

	getType: function(name)
	{
		var num = this.types;
		for(var n = 0; n < num; n++) 
		{
			if(this.types[n] === name) {
				return this.types[n];
			}
		}

		return null;
	},

	//
	types: dopple.types
};
