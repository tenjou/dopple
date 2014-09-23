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
	meta.ajax({
		url: "dopple.h",
		success: function(data) 
		{
			var compiler = new Compiler(data);
			var output = compiler.compile(source);
			console.log(output);
		}
	});	
}