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
		success: function(headers) {
			console.log(dopple.compile(source, headers));
		}
	});	
};