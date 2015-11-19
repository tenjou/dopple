"use strict";

function main() 
{
	meta.ajax({
		url: "../meta.js",
		success: function(source) {
			parse(source);
		}
	});
};

function parse(source)
{
	var comments = [], tokens = [];

	var ast = acorn.parse(source);
	var scope = dopple.acorn.parse(ast);

	console.log(ast);
	console.log(scope);

	var jsonCompiler = new dopple.Compiler.JSON();
	console.log(jsonCompiler.parse(scope));
};