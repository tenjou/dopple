"use strict";

dopple.extern = 
{
	loadPrimitives: function()
	{
		this.globalScope = dopple.resolver.globalScope;
		this.scope = this.globalScope;

		var cls;
		cls = this.createInternalCls("Document");
		var documentInst = this.createInstance("document", cls);

		cls = this.createInternalCls("Window", this.globalScope);
		cls.scope.protoVars["document"] = documentInst;
		cls.flags |= dopple.Flag.RESOLVED;
		this.windowInst = this.createInstance("window", cls);

		this.createVirtualType("Undefined", dopple.SubType.UNKNOWN, dopple.AST.Var, null);
		this.createVirtualType("ObjectDef", dopple.SubType.OBJECT_DEF, null, null);
		this.createVirtualType("SetterGetter", dopple.SubType.SETTER_GETTER, dopple.AST.SetterGetter, null);
		this.createVirtualType("Class", dopple.SubType.CLASS, dopple.AST.Class, null);
		this.createVirtualType("Template", dopple.SubType.TEMPLATE, null, null);
		this.createVirtualType("Args", dopple.SubType.ARGS, dopple.AST.Args, null);
		this.createVirtualType("Regex", dopple.SubType.REGEX, dopple.AST.Regex, null);

		this.load_Number();
		this.load_Bool();
		this.load_String();
		this.load_Function();
		this.load_Object();
		this.load_Array();
		this.createVirtualType("Enum", dopple.SubType.Enum, dopple.AST.Enum, null);
		this.createVirtualType("Map", dopple.SubType.Map, dopple.AST.Map, null);

		this.createCls("RegExp");

		this.loadFuncs_String();	

		cls = this.createInternalCls("Navigator");
		this.addVar(cls, "userAgent", "String");
		this.createInstance("navigator", cls);
		dopple.resolver.resolveCls(cls);

		var obj = this.createObj("console");
		this.addFunc(obj.scope, "log", [ "Args" ], null);
		this.addFunc(obj.scope, "warn", [ "Args" ], null);
		this.addFunc(obj.scope, "error", [ "Args" ], null);

		this.addFunc(this.scope, "parseInt", [ "Number" ], this.createRef("Number"));
		
		this.maxInternalTypeId = this.types.length - 1;
	},

	load_Number: function()
	{
		var cls = this.createInternalType("Number", dopple.SubType.NUMBER, dopple.AST.Number, null);
	},

	load_Bool: function()
	{
		var cls = this.createInternalType("Boolean", dopple.SubType.NUMBER, dopple.AST.Bool, null);
	},

	load_String: function()
	{
		var cls = this.createInternalType("String", dopple.SubType.STRING, dopple.AST.String, null);
	},	

	loadFuncs_String: function()
	{
		var cls = this.typesMap.String.cls;
		var func = this.addFunc(cls.scope, "match", [ "String" ], this.createRef("Array", "String"));
		//this.addParamsToFunc(func, [ ""])
		this.addFunc(cls.scope, "split", [ "String" ], this.createRef("Array", "String"));
	},

	load_Function: function()
	{
		this.createInternalType("Function", dopple.SubType.FUNCTION, dopple.AST.Function, null);
	},

	load_Object: function()
	{
		var nullCls = this.createVirtualType("Null", dopple.SubType.OBJECT, dopple.AST.Null, null);

		var objCls = this.createInternalType("Object", dopple.SubType.OBJECT, dopple.AST.Object, null);
	},

	load_Array: function()
	{
		var cls = this.createInternalType("Array", dopple.SubType.ARRAY, dopple.AST.Array, null);
		this.addFunc(cls.scope, "push", [ "Args" ], this.createRef("Number"));
		this.addFunc(cls.scope, "shift", null, null);
	},				

	createType: function(name, subType, ast, scope)
	{
		if(!scope) {
			scope = new dopple.Scope(this.globalScope);
			scope.protoVars = scope.vars;
		}

		var cls = new dopple.AST.Class(name, scope, null);
		cls.id = this.types.length;

		var type = new dopple.AST.Type(cls, null, subType);
		cls.type = type;

		if(ast) {	
			cls.ast = ast;
			ast.prototype.type = type;
		}

		this.types.push(name);
		this.typesMap[name] = type;

		return cls;
	},

	createCls: function(name, scope) {
		return this.createType(name, 0, null, scope, false);
	},

	createInternalCls(name, scope) {
		return this.createInternalType(name, 0, null, scope, false);
	},

	createInstance: function(name, cls)
	{
		var instance = new dopple.AST.Instance(cls.type);
		instance.type.flags |= dopple.Flag.INTERNAL_TYPE;
		this.globalScope.vars[name] = instance;

		return instance;
	},

	createInternalType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.type.flags |= dopple.Flag.INTERNAL_TYPE;
		this.scope.protoVars[name] = cls;
		return cls;
	},

	createVirtualType: function(name, subType, ast, scope)
	{
		var cls = this.createType(name, subType, ast, scope);
		cls.type.flags |= dopple.Flag.VIRTUAL_TYPE | dopple.Flag.SIMPLE;
		return cls;
	},

	createObj: function(name)
	{
		var scope = new dopple.Scope(this.globalScope);
		var obj = new dopple.AST.Object(scope);

		this.scope.protoVars[name] = obj;

		return obj;
	},

	createRef: function(clsName, templateClsName)
	{
		var ref = new dopple.AST.Reference();

		if(clsName)
		{
			var cls = this.typesMap[clsName];
			if(!cls) {
				throw "TypeError: No '" + clsName + "' class found";
			}

			ref.cls = cls;
		}

		if(templateClsName)
		{
			var templateCls = this.typesMap[templateClsName];
			if(!templateCls) {
				throw "TypeError: No '" + templateClsName + "' class found";
			}

			ref.templateCls = templateCls;
		}

		return ref;
	},

	addVar: function(cls, name, clsName)
	{
		var typeCls = this.typesMap[clsName];
		if(!typeCls) {
			throw "TypeError: No '" + clsName + "' class found";
		}

		var id = new dopple.AST.Identifier(name)
		var ref = new dopple.AST.Reference(id);
		ref.cls = typeCls;
		var varExpr = new dopple.AST.Var(ref, null);
		varExpr.cls = typeCls;
		cls.scope.protoVars[name] = varExpr;
	},

	addFunc: function(scope, name, paramTypes, returnRef)
	{
		var funcScope = scope.createChild();

		var params = null;
		if(paramTypes)
		{
			var numParams = paramTypes.length;
			var paramType, param, id;
			params = new Array(numParams);
			for(var n = 0; n < numParams; n++)
			{
				paramType = paramTypes[n];
				param = new dopple.AST.Param(new dopple.AST.Identifier("arg" + n));
				param.ref.cls = this.typesMap[paramType].cls;
				params[n] = param;
			}
		}

		var func = new dopple.AST.Function(name, funcScope, params);
		func.flags |= dopple.Flag.HIDDEN;
		func.type.flags |= dopple.Flag.EXTERN;
		scope.protoVars[name] = func;

		if(returnRef) {
			func.returnRef = returnRef;
		}
		
		dopple.resolver.resolveFunc(func);
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
	scope: null,
	globalScope: null,
	windowInst: null,

	maxInternalTypeId: 0,
	types: dopple.types,
	typesMap: {}
};
