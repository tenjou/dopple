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
	TOO_MANY_ARGUMENTS: 1001,
	UNSUPPORTED_FEATURE: 1002
};

dopple.error = function(owner, type, arg)
{
	var errorEnum = this.Error;
	if(type === errorEnum.REFERENCE_ERROR) {
		console.error("ReferenceError: " + arg + " is not defined");
	}
	else if(type === this.Error.UNEXPECTED_NUMBER) {
		console.error("SyntaxError: Unexpected number");
	}		
	else if(type === this.Error.UNEXPECTED_TOKEN) {
		console.error("SyntaxError: Unexpected token " + arg);
	}	
	else if(type === this.Error.UNEXPECTED_TOKEN_ILLEGAL) {
		console.error("SyntaxError: Unexpected token ILLEGAL");
	}		 
	else if(type === this.Error.UNEXPECTED_ID) {
		console.error("SyntaxError: Unexpected identifier");
	}		
	else if(type === this.Error.UNEXPECTED_EOI) {
		console.error("SyntaxError: Unexpected end of input");
	}
	else if(type === errorEnum.TOO_MANY_ARGUMENTS) {
		console.error("Too many arguments passed to the \"" + arg + "\" function");
	}		
	else {
		console.error("Error: Unknown error");
	}

	owner.error = type;	
};

dopple.throw = function(type, arg)
{
	if(type === this.Error.REFERENCE_ERROR) {
		throw "ReferenceError: " + arg + " is not defined";
	}
	else if(type === this.Error.UNEXPECTED_TOKEN_ILLEGAL) {
		throw "SyntaxError: Unexpected token ILLEGAL";
	}	
	else if(type === this.Error.UNEXPECTED_ID) {
		throw "SyntaxError: Unexpected identifier";
	}		
	else if(type === this.Error.INVALID_REGEXP) {
		throw "SyntaxError: Invalid regular expression: missing " + arg;
	}	
	else if(type === this.Error.REDEFINITION) {
		throw "Redefined: " + arg;
	}		
	else if(type === this.Error.INVALID_TYPE_CONVERSION) {
		console.error("Invalid Type Conversion: " + arg);
	}
	else if(type === this.Error.TOO_MANY_ARGUMENTS) {
		throw "Too many arguments passed.";
	}
	else if(type === this.Error.UNSUPPORTED_FEATURE) {
		throw "Unsupported feature used: \"" + arg + "\"";
	}
	else {
		console.error("Unknown Error");
	}
};