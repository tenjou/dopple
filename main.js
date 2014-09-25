"use strict";

function main()
{
	meta.ajax({
		url: "source.js",
		success: compile
	});
};

function compile(source) {
	console.log(dopple.compile(source));
};