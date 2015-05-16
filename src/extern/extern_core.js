"use strict";

dopple.extern("core", function(extern) 
{
	var cls = new extern.ast.Class("Null");
	cls.ast = extern.ast.Null;
	cls.clsType = extern.type.NULL;
	extern.nativeVars.Null = cls;

	cls = new extern.ast.Class("Real32");
	cls.ast = extern.ast.Number;
	cls.alt = "real32";
	cls.clsType = extern.type.REAL32;
	extern.nativeVars.Real32 = cls;	
	extern.cachedVars.Real32 = extern.createParam(cls);

	cls = new extern.ast.Class("Args");
	cls.ast = extern.ast.Args;
	cls.clsType = extern.type.ARGS;
	extern.nativeVars.Args = cls;	
	extern.cachedVars.Args = extern.createParam(cls);	

	cls = new extern.ast.Class("Template");
	cls.ast = extern.ast.Template;
	cls.flags |= extern.flagType.TEMPLATE | extern.flagType.KNOWN;
	cls.clsType = extern.type.TEMPLATE;
	extern.nativeVars.Template = cls;	
	extern.cachedVars.Template = extern.createParam(cls);

	var externCls = extern.addClass("Number");
	externCls.cls.ast = extern.ast.Number;
	externCls.cls.alt = "real64";
	externCls.finish();
	extern.nativeVars.Real64 = externCls.cls;
	extern.cachedVars.Real64 = extern.createParam(externCls.cls);

	externCls = extern.addClass("Boolean");
	externCls.cls.alt = "bool";
	externCls.cls.ast = extern.ast.Bool;
	externCls.finish();
	extern.nativeVars.Bool = externCls.cls;
	extern.cachedVars.Bool = extern.createParam(externCls.cls);

	externCls = extern.addClass("String");
	externCls.cls.alt = "char";
	externCls.cls.ast = extern.ast.String;
	externCls.finish();
	extern.nativeVars.String = externCls.cls;
	extern.cachedVars.String = extern.createParam(externCls.cls);

	externCls = extern.addClass("Function");
	externCls.cls.ast = extern.ast.Function;
	externCls.finish();
	extern.nativeVars.Function = externCls.cls;

	externCls = extern.addClass("Array");
	externCls.cls.flags |= extern.flagType.TEMPLATE;
	externCls.cls.ast = extern.ast.Array;
	extern.nativeVars.Array = externCls.cls;
	extern.cachedVars.Array = extern.createParam(externCls.cls);
	externCls.addConstr([ extern.cachedVars.Real64 ]);
	externCls.addConstr([ extern.cachedVars.Array ]);
	externCls.addConstr([ extern.cachedVars.Args ]);
	externCls.addFunc("push", [ extern.cachedVars.Template ], extern.cachedVars.Number, true);
	externCls.addFunc("pop", null, extern.cachedVars.Template);
	externCls.addFunc("shift", null, extern.cachedVars.Template);
	externCls.addMutator("length", extern.nativeVars.Number).flags |= dopple.Flag.SETTER | dopple.Flag.GETTER;
	//externCls.addOp("[", vars.Number, nativeVars.Template);
	externCls.finish();

	externCls = extern.addClass("console");
	externCls.addFunc("log", [ extern.cachedVars.Args ], null);
	externCls.addFunc("warn", [ extern.cachedVars.Args ], null);
	externCls.addFunc("error", [ extern.cachedVars.Args ], null);
	externCls.cls.global = true;
	externCls.finish();

	externCls = extern.addClass("Math");
	externCls.addFunc("abs", [ extern.cachedVars.Number ], extern.cachedVars.Number);
	externCls.addFunc("random", null, extern.cachedVars.Number);
	externCls.addFunc("sin", null, extern.cachedVars.Number);
	externCls.addFunc("cos", null, extern.cachedVars.Number);
	externCls.addVar("PI", extern.nativeVars.Number);
	externCls.cls.global = true;
	externCls.finish();		

	externCls = extern.addClass("Float32Array");
	//externCls.addConstr([ nativeVars. ]);
	externCls.addConstr([ extern.cachedVars.Number ]);
	externCls.addConstr(null);
	externCls.addMutator("length", extern.nativeVars.Number).flags |= dopple.Flag.GETTER;
	externCls.cls.flags |= dopple.Flag.MEMORY_STACK;
	externCls.finish();

	extern.addFunc("__dopple__create", null, null);
	extern.addFunc("__dopple__destroy", null, null);	
});
