"use strict";

dopple.TokenEnum = {
	EOF: 0,
	SYMBOL: 1,
	BINOP: 2,
	UNARY: 3,
	NUMBER: 4,
	BOOL: 5,
	NAME: 6,
	STRING: 7,
	KEYWORD: 8,
	COMMENT: 9,
	ASSIGN: 10,
	BINOP_ASSIGN: 11,
	EOL: 12,
	NEWLINE: 13
};

dopple.ExprEnum = {
	VOID: 0,
	VAR: 1,
	NUMBER: 2,
	BOOL: 3,
	NAME: 4,
	STRING: 5,
	UNARY: 6,
	BINARY: 7,
	FUNCTION: 8,
	FUNCTION_CALL: 9,
	FUNCTION_PTR: 10,
	RETURN: 11,
	PROTOTYPE: 12,
	CLASS: 13,
	FORMAT: 14,
	IF: 15,
	FOR: 16,
	ALLOC: 17,
	MUTATOR: 18,
	GETTER: 19,
	SETTER: 20
};

dopple._VarEnum = {
	VOID: 0,
	NUMBER: 1,
	STRING: 2,
	BOOL: 3,
	FUNCTION: 4,
	FUNCTION_PTR: 5,
	OBJECT: 6,
	NAME: 10,
	FORMAT: 11,
	I32: 12
};

dopple.VarEnum = null;
dopple.VarMap = null;
