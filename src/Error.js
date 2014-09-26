"use strict";

dopple.Error = {
	REFERENCE_ERROR: 1,
	UNEXPECTED_TOKEN: 2,
	UNEXPECTED_TOKEN_ILLEGAL: 3,
	UNEXPECTED_EOI: 4,
	UNEXPECTED_NUMBER: 5,
	UNEXPECTED_ID: 6,
	INVALID_REGEXP: 10,
	INVALID_TYPE_CONVERSION: 1000,
	TOO_MANY_ARGUMENTS: 1001,
	UNSUPPORTED_FEATURE: 1002
};

dopple.throw = function(type, arg)
{
	if(type === this.Error.REFERENCE_ERROR) {
		throw "ReferenceError: " + arg + " is not defined";
	}
	else if(type === this.Error.UNEXPECTED_TOKEN) {
		throw "SyntaxError: Unexpected token " + arg;
	}
	else if(type === this.Error.UNEXPECTED_TOKEN_ILLEGAL) {
		throw "SyntaxError: Unexpected token ILLEGAL";
	}	
	else if(type === this.Error.UNEXPECTED_EOI) {
		throw "SyntaxError: Unexpected end of input";
	}
	else if(type === this.Error.UNEXPECTED_NUMBER) {
		throw "SyntaxError: Unexpected number";
	}	
	else if(type === this.Error.UNEXPECTED_ID) {
		throw "SyntaxError: Unexpected identifier";
	}		
	else if(type === this.Error.INVALID_REGEXP) {
		throw "SyntaxError: Invalid regular expression: missing " + arg;
	}	
	else if(type === this.Error.INVALID_TYPE_CONVERSION) {
		throw "Invalid Type Conversion: " + arg;
	}
	else if(type === this.Error.TOO_MANY_ARGUMENTS) {
		throw "Too many arguments passed.";
	}
	else if(type === this.Error.UNSUPPORTED_FEATURE) {
		throw "Unsupported feature used: \"" + arg + "\"";
	}

	throw "Unknown";
};