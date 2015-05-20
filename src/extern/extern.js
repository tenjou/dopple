"use strict";

dopple.Extern = function() 
{
	this.scope = dopple.scope;
	this.vars = this.scope.vars;
	this.nativeVars = dopple.nativeVars;
	this.ast = dopple.AST;
	this.type = dopple.Type;
	this.flagType = dopple.Flag;

	this.cachedVars = {};
};

dopple.Extern.prototype = 
{
	create: function(varCls)
	{
		var expr = new dopple.AST.Reference(varCls.name, null);
		expr.cls = varCls;
		return expr;
	},

	createTemplate: function(varCls, templateCls)
	{
		var expr = new dopple.AST.Reference(varCls.name, null);
		expr.cls = varCls;
		expr.templateValue = templateCls;
		return expr;
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

	addFunc: function(name, params, returnCls) 
	{
		var scope = new dopple.Scope(dopple.scope);

		var funcExpr = new dopple.AST.Function(name, null, scope, params);
		this.scope.vars[name] = funcExpr;

		if(returnCls) {
			var retExpr = new dopple.AST.Return(new dopple.AST.New(returnCls.name, null, null));
			scope.body.push(retExpr);			
		}

		return funcExpr;
	}	
};

dopple.ExternClass = function(cls) {
	this.cls = cls;
	this.cls.flags |= dopple.Flag.EXTERN;
};

dopple.ExternClass.prototype = 
{
	addVar: function(name, value)
	{
		var varExpr = new value.cls.ast();
		varExpr.name = name;
		varExpr.value = value;
		varExpr.flags |= dopple.Flag.Extern;
		
		if(this.cls.scope.vars[name]) {
			throw "Already defined extern: " + name;
		}

		this.cls.scope.vars[name] = varExpr;	
	},

	addVars: function(buffer, value, hook) 
	{
		var varExpr = new value.cls.ast();
		varExpr.value = value;
		varExpr.flags |= dopple.Flag.Extern;
		varExpr.hook = hook;

		var vars = this.cls.scope.vars;
		var num = buffer.length;
		for(var n = 0; n < num; n++)
		{ 
			if(vars[buffer[n]]) {
				throw "Already defined extern: " + buffer[n];
			}

			vars[buffer[n]] = varExpr;			
		}
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

	addFunc: function(name, params, returnCls, returnAsType) 
	{
		var scope = new dopple.Scope(dopple.scope);

		var funcExpr = new dopple.AST.Function(name, null, scope, params);
		this.cls.scope.vars[name] = funcExpr;

		if(returnCls) 
		{
			var retExpr = null;

			if(returnAsType) {
				retExpr = new dopple.AST.Return(new returnCls.ast());
			}
			else 
			{
				var newExpr = null;
				if(returnCls === dopple.nativeVars.Template) {
					newExpr = new dopple.AST.New(null, null, null);
					newExpr.cls = returnCls;
					newExpr.flags |= dopple.Flag.KNOWN;
				}
				else {
					newExpr = new dopple.AST.New(returnCls.name, null, null);
				}

				retExpr = new dopple.AST.Return(newExpr);
			}
			
			scope.body.push(retExpr);			
		}

		return funcExpr;
	},

	addConstr: function(params)
	{
		var funcExpr = new dopple.AST.Function(name, null, null, params);	

		if(!this.cls.constrBuffer) {
			this.cls.constrBuffer = [ funcExpr ];
		}
		else {
			this.cls.constrBuffer.push(funcExpr);
		}
	},

	addMutator: function(name, cls) {
		var expr = new dopple.AST.Mutator(name);
		expr.cls = cls;
		this.cls.scope.body.push(expr);
		return expr;
	},

	addOp: function(op, argCls, retCls)
	{
		var expr = new dopple.AST.Op
	},

	finish: function() 
	{
		if(!this.cls.constrBuffer) {
			this.cls.constrBuffer = [ new dopple.AST.Function() ];
		}

		dopple.resolver.resolveClass(this.cls);
	}
};
