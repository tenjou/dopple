"use strict";

/* Expression Enum */
var ExprEnum = {
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
	RETURN: 11,
	FORMAT: 12
};

/* Variable Enum */
var VarEnum =
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
};