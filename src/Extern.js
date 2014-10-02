"use strict";

dopple.Extern = function(lexer)
{
	this.lexer = lexer;
	this.global = lexer.global;
	this.scope = this.global;

	this.tokenEnum = Token.Type;
	this.varEnum = Variable.Type;
	this.exprEnum = Expression.Type;	
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
				if(type === this.varEnum.NUMBER) {
					expr = new Expression.Number(0);
				}
				else if(type === this.varEnum.STRING) {
					expr = new Expression.String("");
				}
				else if(type === this.varEnum.STRING_OBJ) {
					expr = new Expression.StringObj("");
				}
				else if(type === this.varEnum.FORMAT) {
					expr = new Expression.Format();
				}

				varExpr = new Expression.Var();
				varExpr.type = type;
				varExpr.var = expr;
				funcParams.push(varExpr);
			}
		}

		var func = new Expression.Function(name, this.scope, funcParams);
		this.scope.vars[name] = func;
	},

	obj: function(name)
	{
		var scope = new dopple.Scope(this.scope);
		var objExpr = new Expression.Object(name, scope);
		this.scope.vars[name] = objExpr;

		return new dopple.ExternObj(this, objExpr);
	},
};

dopple.ExternObj = function(extern, objExpr)
{
	this.extern = extern;
	this.objExpr = objExpr;
};

dopple.ExternObj.prototype =
{
	func: function(name, params, returnType) {
		this.extern.scope = this.objExpr.scope;
		this.extern.func(this.objExpr.name + "$" + name, params, returnType);
		this.extern.scope = this.extern.global;
	},

	getter: function() {

	},

	setter: function() {

	},

	obj: function() {

	}
};