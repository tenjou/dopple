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
		this.scope.vars[name] = func;
	},

	obj: function(name)
	{
		var scope = new dopple.Scope(this.scope);
		var objExpr = new AST.Class(name, scope);
		this.scope.vars[name] = objExpr;

		return new dopple.ExternClass(this, scope, objExpr);
	}
};

dopple.ExternClass = function(extern, scope, objExpr)
{
	this.scope = scope,
	this.extern = extern;
	this.objExpr = objExpr;
};

dopple.ExternClass.prototype =
{
	func: function(name, params, returnType) {
		this.extern.scope = this.objExpr.scope;
		this.extern.func(this.objExpr.name + "$" + name, params, returnType);
		this.extern.scope = this.extern.global;
	},

	obj: function() {

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
