"use strict";

dopple.Extern = function(lexer)
{
	this.lexer = lexer;
	this.global = lexer.global;
	this.scope = this.global;

	this.varEnum = dopple.VarEnum;
	this.exprEnum = dopple.ExprEnum;	
};

dopple.Extern.prototype =
{
	func: function(name, params, returnType)
	{
		returnType = returnType || 0;
		
		var funcParams = null;

		if(params) 
		{
			funcParams = [];

			var varExpr, expr, type;
			var numParams = params.length;
			for(var i = 0; i < numParams; i++) 
			{
				type = params[i];
				funcParams.push(dopple.createVarFromType(type));
			}
		}

		var func = new AST.Function(name, this.scope, funcParams);
		func.extern = true;
		func.type = returnType;
		this.scope.vars[name] = func;

		return func;
	},

	cls: function(name)
	{
		var clsExpr = new AST.Class(name);
		clsExpr.scope = new dopple.Scope(this.scope, clsExpr);
		clsExpr.extern = true;
		this.scope.vars[name] = clsExpr;

		return new dopple.ExternClass(this, clsExpr.scope, clsExpr);
	}
};

dopple.ExternClass = function(extern, scope, clsExpr)
{
	this.scope = scope,
	this.extern = extern;
	this.clsExpr = clsExpr;
};

dopple.ExternClass.prototype =
{
	func: function(name, params, returnType) {
		this.extern.scope = this.clsExpr.scope;
		var func = this.extern.func(name, params, returnType);
		func.parentList = [ this.clsExpr ];
		this.extern.scope = this.extern.global;
	},

	cls: function() {

	},

	mutator: function(name, paramType, returnType) 
	{
		var paramExpr = null;
		if(paramType) {
			paramExpr = dopple.createVarFromType(paramType);
		}

		var returnExpr = null;
		if(returnType) {
			returnExpr = new AST.Return(dopple.createVarFromType(returnType));
		}

		var mutator = new AST.Mutator(name, this.scope, paramExpr, returnExpr);
		this.scope.vars[name] = mutator;
	}	
};
