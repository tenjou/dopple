"use strict";

Lexer.Error = {
	REFERENCE_ERROR: 1,
	UNEXPECTED_EOI: 2,
	INVALID_REGEXP: 10,
	INVALID_TYPE_CONVERSION: 1000,
	TOO_MANY_ARGUMENTS: 1001
};

Lexer.throw = function(type, arg)
{
	var lexerError = Lexer.Error;
	if(type === lexerError.REFERENCE_ERROR) {
		throw "ReferenceError: " + arg + " is not defined";
	}
	else if(type === lexerError.UNEXPECTED_EOI) {
		throw "SyntaxError: Unexpected end of input";
	}
	else if(type === lexerError.INVALID_REGEXP) {
		throw "SyntaxError: Invalid regular expression: missing " + arg;
	}	
	else if(type === lexerError.INVALID_TYPE_CONVERSION) {
		throw "Invalid Type Conversion: Variable " + arg;
	}
	else if(type === lexerError.TOO_MANY_ARGUMENTS) {
		throw "Too many arguments passed.";
	}

	throw "Unknown";
};