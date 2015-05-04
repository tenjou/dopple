"use strict";

dopple.Extern = function(scope) {
	this.scope = scope;
	this.type = dopple.Type;
};

dopple.Extern.prototype = 
{
	loadExterns: function() 
	{
		var extern = dopple.extern;
		var vars = this.scope.vars;

		var cls = extern.addClass("Number");
		cls.cls.alt = "double";
		dopple.AST.Number.prototype.cls = cls.cls;

		cls = extern.addClass("Boolean");
		cls.cls.alt = "bool";
		dopple.AST.Bool.prototype.cls = cls.cls;

		cls = extern.addClass("String");
		cls.cls.alt = "char";
		dopple.AST.String.prototype.cls = cls.cls;

		cls = extern.addClass("Function");
		dopple.AST.Function.prototype.cls = cls.cls;

		cls = extern.addClass("console");
		cls.addFunc("log", [ vars.String ], null);
		cls.addFunc("warn", [ vars.String ], null);
		cls.addFunc("error", [ vars.String ], null);
		cls.cls.global = true;
		cls.finish();

		cls = extern.addClass("WebGLShader");
		cls.finish();	

		cls = extern.addClass("WebGLProgram");
		cls.finish();	
		// cls.cls.alt = "GLuint";
		// cls.cls.flag = 0;

		cls = extern.addClass("WebGLRenderingContext");
		cls.addFunc("viewport", [ vars.Number, vars.Number, vars.Number, vars.Number ], null);
		cls.addFunc("createShader", [ vars.Number ], vars.WebGLShader);
		cls.addFunc("shaderSource", [ vars.WebGLShader, vars.String ], null);
		cls.addFunc("compileShader", [ vars.WebGLShader ]);
		cls.addFunc("createProgram", null, vars.WebGLProgram);
		cls.addFunc("attachShader", [ vars.WebGLProgram, vars.WebGLShader ], null);
		cls.addFunc("linkProgram", [ vars.WebGLProgram ], null);
		cls.addFunc("useProgram", [ vars.WebGLProgram ], null);
		cls.addFunc("getShaderParameter", [ vars.WebGLShader, vars.Number ], vars.Boolean);
		cls.addFunc("getProgramParameter", [ vars.WebGLProgram, vars.Number ], vars.Boolean);
		cls.addFunc("getShaderInfoLog", [ vars.WebGLShader ], vars.String);
		cls.addFunc("getProgramInfoLog", [ vars.WebGLProgram ], vars.String);
		cls.addVar("VERTEX_SHADER", vars.Number);
		cls.addVar("FRAGMENT_SHADER", vars.Number);	
		cls.addVar("COMPILE_STATUS", vars.Number);	
		cls.addVar("LINK_STATUS", vars.Number);		
		cls.finish();

		cls = extern.addClass("Element");
		cls.finish();

		cls = extern.addClass("CanvasElement");
		cls.addFunc("getContext", [ vars.String ], vars.WebGLRenderingContext);
		cls.addVar("width", vars.Number);
		cls.addVar("height", vars.Number);
		cls.finish();		

		cls = extern.addClass("Document");
		cls.addFunc("getElementById", [ vars.String ], vars.CanvasElement);
		cls.finish();

		cls = extern.addClass("Window");
		cls.addNew("document", "Document");
		cls.finish();

		extern.addNew("window", "Window");
		extern.addRef("document", "window.document");
	},

	addClass: function(name) 
	{
		var cls = new dopple.AST.Class(name, new dopple.Scope(this.scope));
		this.scope.vars[name] = cls;

		return new dopple.ExternClass(cls);
	},

	addNew: function(name, clsName) 
	{
		var newExpr = new dopple.AST.New(clsName, null, null);
		var varExpr = new dopple.AST.Var(name, null, newExpr);
		varExpr.flags |= dopple.Flag.HIDDEN | dopple.Flag.EXTERN;
		this.scope.vars[name] = varExpr;

		dopple.resolver.resolveVar(varExpr);		
	},

	addRef: function(name, path) 
	{
		var parents = path.split(".");
		var refName = parents.pop();

		var refExpr = new dopple.AST.Reference(refName, parents);
		var varExpr = new dopple.AST.Var(name, null, refExpr);
		varExpr.flags |= dopple.Flag.HIDDEN | dopple.Flag.EXTERN;
		this.scope.body.push(varExpr);
	},

	addFunc: function(name) {
		var funcExpr = new dopple.AST.Function(name, null, new dopple.Scope(this.scope), null);
		funcExpr.flags |= dopple.Flag.EXTERN;
		this.scope.vars[name] = funcExpr;
	}	
};

dopple.ExternClass = function(cls) {
	this.cls = cls;
	this.cls.flags |= dopple.Flag.EXTERN;
};

dopple.ExternClass.prototype = 
{
	addVar: function(name, cls)
	{
		var varExpr = new dopple.AST.Var(name, null, null);
		varExpr.value = new dopple.AST.Number(0);
		varExpr.flags |= dopple.Flag.Extern;
		this.cls.scope.body.push(varExpr);
	},

	addNew: function(name, clsName) 
	{
		var newExpr = new dopple.AST.New(clsName, null, null);
		var varExpr = new dopple.AST.Var(name, null, newExpr);
		varExpr.flags |= dopple.Flag.Extern;
		this.cls.scope.body.push(varExpr);		
	},

	addRef: function(name, path) 
	{
		var parents = path.split(".");
		var refName = parents.pop();

		var refExpr = new dopple.AST.Reference(refName, parents);
		var varExpr = new dopple.AST.Var(name, null, refExpr);
		varExpr.flags |= dopple.Flag.Extern;
		this.cls.scope.body.push(varExpr);
	},

	addFunc: function(name, paramClasses, returnCls) 
	{
		var scope = new dopple.Scope(dopple.scope);

		var refExpr = null;
		var params = null;

		if(paramClasses)
		{
			var num = paramClasses.length;
			params = new Array(num);
			for(var n = 0; n < num; n++) {
				refExpr = new dopple.AST.Reference("p" + n, null);
				refExpr.cls = paramClasses[n];
				params[n] = refExpr;
			}
		}

		var funcExpr = new dopple.AST.Function(name, null, scope, params);
		this.cls.scope.vars[name] = funcExpr;

		if(returnCls) {
			var retExpr = new dopple.AST.Return(new dopple.AST.New(returnCls.name, null, null));
			scope.body.push(retExpr);			
		}
	},

	finish: function() {
		dopple.resolver.resolveClass(this.cls);
	}
};
