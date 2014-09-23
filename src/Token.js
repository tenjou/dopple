"use strict";

function Token() 
{
	this.type = 0;
	this.str = "";
	this.value = 0;
};

Token.Type = 
{
	EOF: 0,
	SYMBOL: -10,
	BINOP: -11,
	NUMBER: -12,
	BOOL: -13,
	STRING: -14,
	VAR: -20,
	RETURN: -21,
	FUNCTION: -22
};