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
	var compiler = new Compiler.C();
	console.log("\n" + compiler.compile(source));
};