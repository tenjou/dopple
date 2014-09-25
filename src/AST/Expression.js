"use strict";

var Expression = {};

Expression.Base = function(exprType) {
	this.type = 0;
	this.exprType = exprType || 0;
};

Expression.Base.prototype = 
{
	analyse: function() {},

	to: function(type) {
		return "void";
	},

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
	VOID: 0,
	VAR: 1,
	NUMBER: 2,
	BOOL: 3,
	STRING: 4,
	STRING_OBJ: 5,
	BINARY: 6,
	FUNCTION: 7,
	FUNCTION_CALL: 8,
	PROTOTYPE: 9,
	OBJECT: 10,
	RETURN: 11
};

var Variable =
{
	Type:
	{
		VOID: 0,
		NUMBER: 1,
		BOOL: 2,
		STRING: 3,
		STRING_OBJ: 4,
		OBJECT: 5,
		FORMAT: 6,
		ARGUMENTS: 7,
		SCOPE: 8
	}
};