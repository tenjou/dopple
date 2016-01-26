"use strict";

function main() 
{
	meta.ajax({
		url: "../meta2d.js",
		success: function(source) {
			parse(source);
		}
	});
};

function parse(source)
{
	dopple.setup();

	var comments = [], tokens = [];

	var ast = acorn.parse(source);
	var scope = dopple.acorn.parse(ast);

	// console.log(ast);
	// console.log(scope);

	dopple.resolver.resolve(scope);
	var output = dopple.compiler.js.compile(scope);

	// for(var key in output) {
	// 	console.log(key);
	// }
	console.log(output);
	//var htmlOutput = dopple.compiler.jsonHtml.compile(output);

	//console.log(htmlOutput);

	//document.body.innerHTML = htmlOutput;
	//console.log(output);
	//console.log(JSON.stringify(output));
};