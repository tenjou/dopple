"use strict";

dopple.TokenEnum = {
	EOF: 0,
	SYMBOL: 1,
	BINOP: 2,
	NUMBER: 3,
	BOOL: 4,
	NAME: 5,
	STRING: 6,
	VAR: 7,
	FUNCTION: 8,
	RETURN: 9,
	COMMENT: 10
};

dopple.ExprEnum = {
	VOID: 0,
	VAR: 1,
	NUMBER: 2,
	BOOL: 3,
	NAME: 4,
	STRING: 5,
	BINARY: 6,
	FUNCTION: 7,
	FUNCTION_CALL: 8,
	FUNCTION_PTR: 9,
	RETURN: 10,
	PROTOTYPE: 11,
	CLASS: 12,
	FORMAT: 13
};

dopple.VarEnum = {
	VOID: 0,
	NUMBER: 1,
	STRING: 2,
	BOOL: 3,
	FUNCTION: 4,
	FUNCTION_PTR: 5,
	CLASS: 6,
	NAME: 10,
	FORMAT: 11
};