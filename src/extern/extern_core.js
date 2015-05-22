"use strict";

dopple.extern("core", function(extern) 
{
	var type = null;
	var externCls = null;

	type = extern.addType("Void", extern.type.UNKNOWN, extern.type.UNKNOWN, extern.flagType.KNOWN);
	type.ast = extern.ast.Base;
	type.alt = "void";

	type = extern.addType("VoidPtr", extern.type.UNKNOWN, extern.type.UNKNOWN, 
		extern.flagType.KNOWN | extern.flagType.PTR);
	type.ast = extern.ast.Base;
	type.alt = "void";

	type = extern.addType("Real32", extern.type.NUMBER, extern.type.REAL32, extern.flagType.KNOWN);
	type.ast = extern.ast.Number;
	type.alt = "real32";

	type = extern.addType("Real64", extern.type.NUMBER, extern.type.REAL64, extern.flagType.KNOWN);
	type.ast = extern.ast.Number;
	type.alt = "real64";
	extern.ast.Number.prototype.type = type;
	extern.addClass("Number").finish();

	type = extern.addType("Bool", extern.type.NUMBER, extern.type.BOOL, extern.flagType.KNOWN);
	type.ast = extern.ast.Bool;
	type.alt = "int8";	
	extern.ast.Bool.prototype.type = type;
	extern.addClass("Boolean").finish();

	type = extern.addType("String", extern.type.STRING, extern.type.STRING, 
		extern.flagType.KNOWN | extern.flagType.PTR);
	type.ast = extern.ast.String;
	type.alt = "char";	
	extern.ast.String.prototype.type = type;
	extern.addClass("String").finish();

	type = extern.addType("Function", extern.type.FUNCTION, extern.type.FUNCTION);
	type.ast = extern.ast.Function;	
	extern.addClass("Function").finish();

	type = extern.addType("Null", extern.type.CLASS, extern.type.NULL);
	type.ast = extern.ast.Null;

	type = extern.addType("Args", extern.type.ARGS, extern.type.ARGS);
	type.ast = extern.ast.Args;	

	type = extern.addType("Template", extern.type.TEMPLATE, extern.type.TEMPLATE);
	type.ast = extern.ast.Template;

	type = extern.addType("Class", extern.type.CLASS, extern.type.CLASS);
	type.ast = extern.ast.Class;	

	externCls = extern.addClassType("Array", extern.type.ARRAY);
	externCls.addConstr([ extern.typeVars.Real64 ]);
	externCls.addConstr([ extern.typeVars.Array ]);
	externCls.addConstr([ extern.typeVars.Args ]);
	externCls.addFunc("push", [ extern.typeVars.Template ], extern.types.Number, true);
	externCls.addFunc("pop", null, extern.types.Template);
	externCls.addFunc("shift", null, extern.types.Template);
	externCls.addMutator("length", extern.typeVars.Real64).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	externCls.finish();

	// externCls = extern.addClass("Array");
	// externCls.cls.flags |= extern.flagType.TEMPLATE;
	// externCls.cls.ast = extern.ast.Array;
	// externCls.cls.varType = extern.type.ARRAY;
	// extern.nativeVars.Array = externCls.cls;
	// extern.cachedVars.Array = extern.create(externCls.cls);
	// externCls.addConstr([ extern.cachedVars.Real64 ]);
	// externCls.addConstr([ extern.cachedVars.Array ]);
	// externCls.addConstr([ extern.cachedVars.Args ]);
	// externCls.addFunc("push", [ extern.cachedVars.Template ], extern.cachedVars.Number, true);
	// externCls.addFunc("pop", null, extern.cachedVars.Template);
	// externCls.addFunc("shift", null, extern.cachedVars.Template);
	// externCls.addMutator("length", extern.nativeVars.Real64).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	// //externCls.addOp("[", vars.Number, nativeVars.Template);
	// externCls.finish();

	externCls = extern.addClass("console");
	externCls.addFunc("log", [ extern.typeVars.Args ], null);
	externCls.addFunc("warn", [ extern.typeVars.Args ], null);
	externCls.addFunc("error", [ extern.typeVars.Args ], null);
	externCls.cls.flags |= extern.flagType.MEMORY_STACK;
	externCls.finish();

	externCls = extern.addClass("Math");
	externCls.addFunc("abs", [ extern.typeVars.Real64 ], extern.types.Real64);
	externCls.addFunc("random", null, extern.types.Real64);
	externCls.addFunc("sin", [ extern.typeVars.Real64 ], extern.types.Real64);
	externCls.addFunc("cos", [ extern.typeVars.Real64 ], extern.types.Real64);
	externCls.addVar("PI", extern.typeVars.Real64);
	externCls.cls.flags |= extern.flagType.MEMORY_STACK;
	externCls.finish();		

	// externCls = extern.addClass("Float32Array");
	// externCls.addConstr([ extern.createTemplate(extern.nativeVars.Array, extern.nativeVars.Real32) ]);
	// externCls.addConstr([ extern.cachedVars.Real64 ]);
	// externCls.addConstr(null);
	// externCls.addMutator("length", extern.nativeVars.Real64).flags |= dopple.Flag.GETTER;
	// externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	// externCls.finish();
	// extern.cachedVars.Float32Array = extern.create(externCls.cls);

	extern.addFunc("__dopple__create__", null, null).hook = function() { return "dopple::create"; };
	extern.addFunc("__dopple__destroy__", null, null).hook = function() { return "dopple::destroy"; };
});
