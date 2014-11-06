"use strict";

function main()
{
	meta.ajax({
		url: "source.js",
		success: compile
	});
};

function compile(source) 
{
	var lexer = new Lexer.Mantra();
	var compiler = new Compiler.JS(lexer);
	console.log("\n" + compiler.compile(source));
};