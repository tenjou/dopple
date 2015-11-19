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

	dopple.resolver.resolve(scope);
	console.log(dopple.compiler.json.compile(scope));
};