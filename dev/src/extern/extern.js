"use strict";

dopple.extern = 
{
	loadPrimitives: function()
	{
		this.globalScope = dopple.resolver.globalScope;

		this.addVirtualType("Void", dopple.SubType.UNKNOWN, dopple.AST.Var, null);
		this.addVirtualType("ObjectDef", dopple.SubType.OBJECT_DEF, dopple.AST.Object, null);
		this.addVirtualType("SetterGetter", dopple.SubType.SETTER_GETTER, dopple.AST.SetterGetter, null);
		this.addVirtualType("Class", dopple.SubType.CLASS, dopple.AST.Class, null);

		this.addInternalType("Number", dopple.SubType.NUMBER, dopple.AST.Number, null);
		this.addInternalType("Bool", dopple.SubType.NUMBER, dopple.AST.Bool, null);
		this.addInternalType("String", dopple.SubType.STRING, dopple.AST.String, null);
		this.addInternalType("Function", dopple.SubType.FUNCTION, dopple.AST.Function, null);
		this.addInternalType("Object", dopple.SubType.OBJECT, [ dopple.AST.Object, dopple.AST.Null ], null);
		this.addInternalType("Array", dopple.SubType.ARRAY, dopple.AST.Array, null);
	},

	createType: function(name, subType, ast, scope)
	{
		if(!scope) {
			scope = new dopple.Scope();
		}

		var cls = new dopple.AST.Class(name, scope, null);
		cls.id = this.numTypes++;
		cls.cls = cls;
		cls.subType = subType;
		this.types.push(name);

		if(ast) 
		{	
			if(ast instanceof Array) 
			{
				var num = ast.length;
				for(var n = 0; n < num; n++) {
					ast[n].prototype.cls = cls;
				}
			}
			else {
				ast.prototype.cls = cls;
			}
		}

		return cls;
	},

	addInternalType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.flags |= dopple.Flag.INTERNAL_TYPE;
		this.globalScope.vars[name] = cls;

		return cls;
	},

	addVirtualType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.flags |= dopple.Flag.VIRTUAL_TYPE;

		return cls;
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
	globalScope: null,
	numTypes: 0,
	types: dopple.types
};
