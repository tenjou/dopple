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
		this.addVirtualType("Args", dopple.SubType.ARGS, dopple.AST.Args, null);

		this.load_Number();
		this.load_Bool();
		this.load_String();
		this.load_Function();
		this.load_Object();
		this.load_Array();
		
		this.maxInternalTypeId = this.types.length - 1;
	},

	load_Number: function()
	{
		var cls = this.addInternalType("Number", dopple.SubType.NUMBER, dopple.AST.Number, null);
		cls.flags |= dopple.Flag.SIMPLE;
	},

	load_Bool: function()
	{
		var cls = this.addInternalType("Bool", dopple.SubType.NUMBER, dopple.AST.Bool, null);
		cls.flags |= dopple.Flag.SIMPLE;
	},

	load_String: function()
	{
		var cls = this.addInternalType("String", dopple.SubType.STRING, dopple.AST.String, null);
		cls.flags |= dopple.Flag.SIMPLE;
	},	

	load_Function: function()
	{
		this.addInternalType("Function", dopple.SubType.FUNCTION, dopple.AST.Function, null);
	},

	load_Object: function()
	{
		this.addInternalType("Object", dopple.SubType.OBJECT, [ dopple.AST.Object, dopple.AST.Null ], null);
	},

	load_Array: function()
	{
		var cls = this.addInternalType("Array", dopple.SubType.ARRAY, dopple.AST.Array, null);
		this.addFunc(cls, "push", [ "Args" ], "Number");
		dopple.resolver.resolveCls(cls);
	},				

	createType: function(name, subType, ast, scope)
	{
		if(!scope) {
			scope = new dopple.Scope();
			scope.protoVars = scope.vars;
		}

		var cls = new dopple.AST.Class(name, scope, null);
		cls.id = this.types.length;
		cls.cls = cls;
		cls.ast = ast;

		if(subType) {
			cls.subType = subType;
		}
		
		this.types.push(name);
		this.typesMap[name] = cls;

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

	createCls: function(name, scope) {
		return this.createType(name, 0, null, scope);
	},

	addInternalType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.flags |= dopple.Flag.INTERNAL_TYPE;

		return cls;
	},

	addVirtualType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.flags |= dopple.Flag.VIRTUAL_TYPE;

		return cls;
	},

	addFunc: function(cls, name, params, returnType)
	{
		var clsScope = cls.scope;
		var scope = clsScope.createChild();

		var paramBuffer = null;
		if(params)
		{
			var numParams = params.length;
			var param, id, expr, ref;
			paramBuffer = new Array(numParams);
			for(var n = 0; n < numParams; n++)
			{
				param = params[n];
				id = new dopple.AST.Identifier("arg" + n);
				expr = new this.typesMap[param].cls.ast();
				ref = new dopple.AST.Reference(id, expr);
				paramBuffer[n] = ref;
			}
		}

		var func = new dopple.AST.Function(name, scope, paramBuffer);
		cls.scope.bodyFuncs.push(func);
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

	maxInternalTypeId: 0,
	types: dopple.types,
	typesMap: {}
};
