"use strict";

dopple.Error = {
	UNKNOWN: 0,
	REFERENCE_ERROR: 1,
	UNEXPECTED_TOKEN: 2,
	UNEXPECTED_TOKEN_ILLEGAL: 3,
	UNEXPECTED_EOI: "SyntaxError: Unexpected end of input",
	UNEXPECTED_NUMBER: 5,
	UNEXPECTED_ID: 6,
	INVALID_REGEXP: 10,
	REDEFINITION: 100,
	INVALID_TYPE_CONVERSION: "Invalid Type Conversion: ",
	UNSUPPORTED_FEATURE: 1002,
	EXPECTED_FUNC: 1003,
	EXPECTED_CLS: 1004,
	EXPECTED_CLS_OR_FUNC: 1005,
	TOO_MANY_ARGS: 1006,
	EXPR_WITH_VOID: 2000,
	INCOMPATIBLE_TYPE: 2001
};

dopple.error = function(line, type, arg, arg2, arg3)
{
	var line = "(" + dopple.lexer.fileName + ":" + line + ") ";

	var errorEnum = this.Error;
	if(type === errorEnum.REFERENCE_ERROR) {
		console.error(line + "ReferenceError: [" + arg + "] is not defined");
	}
	else if(type === this.Error.UNEXPECTED_NUMBER) {
		console.error(line + "SyntaxError: Unexpected number");
	}		
	else if(type === this.Error.UNEXPECTED_TOKEN) {
		console.error(line + "SyntaxError: Unexpected token [" + arg + "]");
	}	
	else if(type === this.Error.UNEXPECTED_TOKEN_ILLEGAL) {
		console.error(line + "SyntaxError: Unexpected token ILLEGAL");
	}		 
	else if(type === this.Error.UNEXPECTED_ID) {
		console.error(line + "SyntaxError: Unexpected identifier");
	}		
	else if(type === this.Error.UNEXPECTED_EOI) {
		console.error(line + "SyntaxError: Unexpected end of input");
	}
	else if(type === errorEnum.REDEFINITION) {
		console.error(line + "Redefined: [" + arg + "] is already defined previously");
	}	
	else if(type === errorEnum.EXPECTED_FUNCTION) {
		console.error(line + "Expected to be a function: " + arg + "]");
	}	
	else if(type === errorEnum.EXPECTED_CLS) {
		console.error(line + "Expected to be a class: [" + arg + "]");
	}		
	else if(type === errorEnum.EXPECTED_CLS_OR_FUNC) {
		console.error(line + "Expected to be a class or function: [" + arg + "]");
	}	
	else if(type === errorEnum.EXPR_WITH_VOID) {
		console.error(line + arg + " has an expression with type 'void'");
	}	
	else if(type === errorEnum.INCOMPATIBLE_TYPE) {
		console.error(line + "Expression of [" + arg + "] has an incompatible type: [" + arg2 + "]");
	}	
	else if(type === errorEnum.TOO_MANY_ARGS) 
	{
		console.error(line + "Function call of [" + arg + "] has too many arguments: has [" + 
			arg2 + "] but expected [" + arg3 + "]");
	}
	else {
		console.error(line + "Error: Unknown error");
	}

	dopple.lexer.error = type;	
	dopple.isError = true;
};
