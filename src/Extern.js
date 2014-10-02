"use strict";

dopple.Extern = function(lexer)
{
	this.lexer = lexer;
	this.global = lexer.global;
	
	this.tokenEnum = Token.Type;
	this.varEnum = Variable.Type;
	this.exprEnum = Expression.Type;	
};

dopple.Extern.prototype =
{
	func: function(name, params)
	{
		var funcParams = null;

		if(params) 
		{
			funcParams = [];

			var varExpr, expr, type;
			var numParams = params.length;
			for(var i = 0; i < numParams; i += 2) 
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

				varExpr = new Expression.Var(params[i + 1]);
				varExpr.type = type;
				varExpr.var = expr;
				funcParams.push(varExpr);
			}
		}

		var func = new Expression.Function(name, this.global, funcParams);
		this.global.vars[name] = func;
	},

	obj: function(name)
	{
		var scope = new dopple.Scope(this.global);
		var objExpr = new Expression.Object(name, scope);
		this.global.vars[name] = objExpr;

		return new dopple.ExternObj(objExpr);
	},
};

dopple.ExternObj = function(objExpr)
{
	this.objExpr = objExpr;
};

dopple.ExternObj.prototype =
{
	func: function() {

	},

	obj: function() {

	}
};