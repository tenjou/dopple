"use strict";

dopple.extern("core", function(extern) 
{
	var type = null;
	var externCls = null;

	type = extern.addType("Void", extern.type.UNKNOWN, extern.type.UNKNOWN, extern.flagType.KNOWN);
	type.ast = extern.ast.Void;
	type.alt = "void";
	extern.addVar(type);

	type = extern.addType("VoidPtr", extern.type.UNKNOWN, extern.type.UNKNOWN, 
		extern.flagType.KNOWN | extern.flagType.PTR);
	type.ast = extern.ast.Null;
	type.alt = "void";
	extern.addVar(type);

	type = extern.addType("Real32", extern.type.NUMBER, extern.type.REAL32, extern.flagType.KNOWN);
	type._ast = extern.ast.Number;
	type.alt = "real32";

	type = extern.addType("Real64", extern.type.NUMBER, extern.type.REAL64, extern.flagType.KNOWN);
	type.ast = extern.ast.Number;
	type.alt = "real64";
	extern.addDefaultParam(type);
	extern.addNativeClass("Number", type).finish();

	type = extern.addType("Bool", extern.type.NUMBER, extern.type.BOOL, extern.flagType.KNOWN);
	type.ast = extern.ast.Bool;
	type.alt = "int8";
	extern.addDefaultParam(type);
	extern.addNativeClass("Boolean", type).finish();

	type = extern.addType("String", extern.type.STRING, extern.type.STRING, 
		extern.flagType.KNOWN | extern.flagType.PTR);
	type.ast = extern.ast.String;
	type.alt = "char";
	extern.addDefaultParam(type);
	extern.addNativeClass("String", type).finish();

	type = extern.addType("Function", extern.type.FUNCTION, extern.type.FUNCTION);
	extern.addNativeClass("Function", type).finish();

	type = extern.addType("Null", extern.type.CLASS, extern.type.NULL, extern.flagType.PTR);
	type.ast = extern.ast.Null;
	type.alt = "void";

	type = extern.addType("Args", extern.type.ARGS, extern.type.ARGS, extern.flagType.ARGS);
	type.ast = extern.ast.Args;	

	type = extern.addType("TypeArgs", extern.type.TYPE_ARGS, extern.type.TYPE_ARGS, extern.flagType.ARGS);

	type = extern.addType("ArrayArgs", extern.type.ARRAY_ARGS, extern.type.ARRAY_ARGS, extern.flagType.ARGS);
	// type.ast = extern.ast.ArrayArgs;		

	type = extern.addType("Template", extern.type.TEMPLATE, extern.type.TEMPLATE);
	type.ast = extern.ast.Template;

	type = extern.addType("Array", extern.type.ARRAY, extern.type.ARRAY, 
		extern.flagType.PTR | extern.flagType.MEMORY_STACK | extern.flagType.TEMPLATE);
	type.ast = extern.ast.Array;
	externCls = extern.addNativeClass("Array", type);
	externCls.addConstr([ extern.typeDefaultParams.Real64 ]);
	externCls.addConstr([ extern.typeParams.Array ]);
	externCls.addConstr([ extern.typeParams.TypeArgs ]);
	externCls.addFunc("push", [ extern.typeParams.Template ], extern.types.Number);
	externCls.addFunc("pop", null, extern.types.Template);
	externCls.addFunc("shift", null, extern.types.Template);
	externCls.addMutator("length", extern.typeParams.Real64).flags |= extern.flagType.SETTER | extern.flagType.GETTER;
	externCls.finish();

	type = extern.addType("Float32Array", extern.type.CLASS, extern.type.CLASS, 
		extern.flagType.PTR | extern.flagType.MEMORY_STACK);
	externCls = extern.addClass("Float32Array", type);
	//externCls.addConstr([ extern.createTemplate(extern.typeVars.Array, extern.typeVars.Real32) ]);
	externCls.addConstr([ extern.typeParams.Real64 ]);
	externCls.addConstr(null);
	externCls.addMutator("length", extern.typeParams.Real64).flags |= dopple.Flag.GETTER;
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
	externCls.addFunc("log", [ extern.typeParams.Args ], null);
	externCls.addFunc("warn", [ extern.typeParams.Args ], null);
	externCls.addFunc("error", [ extern.typeParams.Args ], null);
	externCls.cls.flags |= extern.flagType.MEMORY_STACK;
	externCls.finish();

	externCls = extern.addClass("Math");
	externCls.addFunc("abs", [ extern.typeParams.Real64 ], extern.types.Real64);
	externCls.addFunc("random", null, extern.types.Real64);
	externCls.addFunc("sin", [ extern.typeParams.Real64 ], extern.types.Real64);
	externCls.addFunc("cos", [ extern.typeParams.Real64 ], extern.types.Real64);
	externCls.addVar("PI", extern.typeParams.Real64);
	externCls.cls.flags |= extern.flagType.MEMORY_STACK;
	externCls.finish();		

	extern.addFunc("__dopple__create__", null, null).hook = function() { return "dopple::create"; };
	extern.addFunc("__dopple__destroy__", null, null).hook = function() { return "dopple::destroy"; };
});
