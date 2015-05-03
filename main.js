"use strict";

function main() 
{
	meta.ajax({
		url: "source.js",
		success: function(source) {
			parse(source);
		}
	});
};

function parse(source) 
{
	// try 
	// {
		var acornAST = acorn.parse(source);
		// console.log(acornAST);

		dopple.importAcorn(acornAST);
		console.log(dopple.compile());
		// console.log(dopple.scope);		
	// }
	// catch(err) {
	// 	console.error(err);
	// }
};
