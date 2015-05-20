"use strict";

dopple.extern("core", function(extern) 
{
	var cls = new extern.ast.Class("Null");
	cls.ast = extern.ast.Null;
	cls.clsType = extern.type.NULL;
	cls.varType = extern.type.CLASS;
	extern.nativeVars.Null = cls;

	cls = new extern.ast.Class("Real32");
	cls.cls = cls.cls;
	cls.alt = "real32";
	cls.ast = extern.ast.Number;
	cls.clsType = extern.type.REAL32;
	cls.varType = extern.type.NUMBER;
	extern.nativeVars.Real32 = cls;	
	extern.cachedVars.Real32 = extern.create(cls);

	var externCls = extern.addClass("Real64");
	externCls.cls.alt = "real64";
	externCls.cls.ast = extern.ast.Number;
	externCls.cls.clsType = extern.type.NUMBER;
	externCls.cls.varType = extern.type.NUMBER;
	externCls.finish();
	extern.nativeVars.Real64 = externCls.cls;
	extern.cachedVars.Real64 = extern.create(externCls.cls);

	cls = new extern.ast.Class("Args");
	cls.ast = extern.ast.Args;
	cls.clsType = extern.type.ARGS;
	cls.varType = extern.type.ARGS;
	extern.nativeVars.Args = cls;	
	extern.cachedVars.Args = extern.create(cls);

	cls = new extern.ast.Class("Template");
	cls.ast = extern.ast.Template;
	cls.flags |= extern.flagType.TEMPLATE | extern.flagType.KNOWN;
	cls.clsType = extern.type.TEMPLATE;
	cls.varType = extern.type.TEMPLATE;
	extern.nativeVars.Template = cls;	
	extern.cachedVars.Template = extern.create(cls);

	externCls = extern.addClass("Boolean");
	externCls.cls.alt = "int8";
	externCls.cls.ast = extern.ast.Bool;
	externCls.cls.clsType = extern.type.BOOL;
	externCls.cls.varType = extern.type.NUMBER;
	externCls.finish();
	extern.nativeVars.Bool = externCls.cls;
	extern.cachedVars.Bool = extern.create(externCls.cls);

	externCls = extern.addClass("String");
	externCls.cls.alt = "char";
	externCls.cls.ast = extern.ast.String;
	externCls.cls.clsType = extern.type.STRING;
	externCls.cls.varType = extern.type.STRING;
	externCls.finish();
	extern.nativeVars.String = externCls.cls;
	extern.cachedVars.String = extern.create(externCls.cls);

	externCls = extern.addClass("Function");
	externCls.cls.ast = extern.ast.Function;
	externCls.cls.varType = extern.type.FUNCTION;
	externCls.finish();
	extern.nativeVars.Function = externCls.cls;
	extern.cachedVars.Function = extern.create(externCls.cls);

	externCls = extern.addClass("Array");
	externCls.cls.flags |= extern.flagType.TEMPLATE;
	externCls.cls.ast = extern.ast.Array;
	externCls.cls.varType = extern.type.ARRAY;
	extern.nativeVars.Array = externCls.cls;
	extern.cachedVars.Array = extern.create(externCls.cls);
	externCls.addConstr([ extern.cachedVars.Real64 ]);
	externCls.addConstr([ extern.cachedVars.Array ]);
	externCls.addConstr([ extern.cachedVars.Args ]);
	externCls.addFunc("push", [ extern.cachedVars.Template ], extern.cachedVars.Number, true);
	externCls.addFunc("pop", null, extern.cachedVars.Template);
	externCls.addFunc("shift", null, extern.cachedVars.Template);
	externCls.addMutator("length", extern.nativeVars.Real64).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	//externCls.addOp("[", vars.Number, nativeVars.Template);
	externCls.finish();

	externCls = extern.addClass("console");
	externCls.addFunc("log", [ extern.cachedVars.Args ], null);
	externCls.addFunc("warn", [ extern.cachedVars.Args ], null);
	externCls.addFunc("error", [ extern.cachedVars.Args ], null);
	externCls.cls.global = true;
	externCls.finish();

	externCls = extern.addClass("Math");
	externCls.addFunc("abs", [ extern.cachedVars.Real64 ], extern.cachedVars.Number);
	externCls.addFunc("random", null, extern.cachedVars.Real64);
	externCls.addFunc("sin", null, extern.cachedVars.Real64);
	externCls.addFunc("cos", null, extern.cachedVars.Real64);
	externCls.addVar("PI", extern.nativeVars.Real64);
	externCls.cls.global = true;
	externCls.finish();		

	externCls = extern.addClass("Float32Array");
	externCls.addConstr([ extern.createTemplate(extern.nativeVars.Array, extern.nativeVars.Real32) ]);
	externCls.addConstr([ extern.cachedVars.Real64 ]);
	externCls.addConstr(null);
	externCls.addMutator("length", extern.nativeVars.Real64).flags |= dopple.Flag.GETTER;
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();
	extern.cachedVars.Float32Array = extern.create(externCls.cls);

	extern.addFunc("__dopple__create__", null, null).hook = function() { return "dopple::create"; };
	extern.addFunc("__dopple__destroy__", null, null).hook = function() { return "dopple::destroy"; };
});
