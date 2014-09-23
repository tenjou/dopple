"use strict";

window.Expression = {};

Expression.Base = function(exprType) {
	this.type = 0;
	this.exprType = exprType || 0;
};

Expression.Base.prototype = 
{
	strType: function()
	{
		var type = Variable.Type;

		for(var key in type) 
		{
			if(type[key] === this.type) {
				return key;
			}
		}

		return "";
	},

	strExprType: function()
	{
		var type = Variable.Type;

		for(var key in Expression.Type) 
		{
			if(type[key] === this.exprType) {
				return key;
			}
		}

		return "";
	}
};


Expression.Type = {
	UNKNOWN: 0,
	VAR: 1,
	NUMBER: 2,
	BOOL: 4,
	STRING: 4,
	BINARY: 5,
	FUNCTION: 6,
	FUNCTION_CALL: 7,
	PROTOTYPE: 8,
	OBJECT: 9,
	RETURN: 10
};

var Variable =
{
	Type:
	{
		UNKNOWN: 0,
		NUMBER: 1,
		BOOL: 2,
		STRING: 3,
		OBJECT: 4,
		STRING_OBJ: 5,
		FORMAT: 6,
		ARGUMENTS: 7,
		SCOPE: 8
	}
};