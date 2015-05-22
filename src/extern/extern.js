"use strict";

dopple.Extern = function() 
{
	this.scope = dopple.scope;
	this.vars = this.scope.vars;
	this.types = dopple.types;
	this.typeVars = dopple.typeVars;
	this.ast = dopple.AST;
	this.type = dopple.Type;
	this.flagType = dopple.Flag;

	this.cachedVars = {};
};

dopple.Extern.prototype = 
{
	addType: function(name, typeEnum, nativeTypeEnum, flags)
	{
		if(this.types[name]) {
			throw "There is already defined type with such name: " + name;	
		}

		flags = flags || 0;

		var type = new this.ast.Type(name, typeEnum, nativeTypeEnum);
		type.flags = flags;
		this.types[name] = type;

		var varExpr = new this.ast.Var(name);
		varExpr.type = type;
		varExpr.flags = type.flags;
		this.typeVars[name] = varExpr;

		return type;
	},

	addClass: function(name)
	{
		if(this.vars[name]) {
			throw "There is already defined type with such name: " + name;	
		}

		var scope = new dopple.Scope();
		var clsExpr = new this.ast.Class(name, scope);
		clsExpr.type = this.types.Class;
		this.vars[name] = clsExpr;

		var cls = new dopple.ExternClass(clsExpr);
		return cls;
	},

	addClassType: function(name, typeEnum)
	{
		var type = this.addType(name, typeEnum, typeEnum);
		var cls = this.addClass(name);
		return cls;
	},

	addNamespace: function(name)
	{
		//var cls = this.class(name, this.typeVars.Namepace);

		return cls;		
	},

	create: function(varCls)
	{
		var expr = new dopple.AST.Reference(varCls.name, null);
		expr.cls = varCls;
		return expr;
	},

	createTemplate: function(varCls, templateCls)
	{
		var expr = new dopple.AST.Reference(varCls.name, null);
		expr.ttpe = varCls;
		expr.templateValue = templateCls;
		return expr;
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
	addVar: function(name, typeVar)
	{		
		if(this.cls.scope.vars[name]) {
			throw "Already defined extern: " + name;
		}

		this.cls.scope.vars[name] = typeVar;	
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

	addFunc: function(name, params, returnType, returnAsType) 
	{
		var scope = new dopple.Scope(dopple.scope);

		var funcExpr = new dopple.AST.Function(name, null, scope, params);
		this.cls.scope.vars[name] = funcExpr;

		if(returnType) 
		{
			var valueExpr = new returnType.ast();
			var retExpr = new dopple.AST.Return(valueExpr);

			// if(returnAsType) {
			// 	retExpr = new dopple.AST.Return();
			// 	retExpr.type = returnType;
			// }
			// else 
			// {
			// 	var newExpr = null;
			// 	if(returnCls === dopple.nativeVars.Template) {
			// 		newExpr = new dopple.AST.New(null, null, null);
			// 		newExpr.cls = returnCls;
			// 		newExpr.flags |= dopple.Flag.KNOWN;
			// 	}
			// 	else {
			// 		newExpr = new dopple.AST.New(returnCls.name, null, null);
			// 	}

			// 	retExpr = new dopple.AST.Return(newExpr);
			// }
			
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

	finish: function() {
		dopple.resolver.resolveClass(this.cls);
	}
};
