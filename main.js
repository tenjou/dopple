"use strict";

function main()
{
	var a = new AST.Var("a");
	a.expr = new AST.Number(10);

	var compiler = new Compiler.Mantra();
	console.log(compiler.compileAST(a));

// 	meta.ajax({
// 		url: "source.js",
// 		success: compile
// 	});
};

function compile(source) {
	//console.log(dopple.compile(source));
	// var expr = dopple.Expression;

	// var a = new expr.Var("a");
	// a.expr = new expr.Number(10);

	// dopple.compileAST(a);
};