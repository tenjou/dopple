"use strict";

function main()
{
	meta.ajax({
		url: "source.mtr",
		success: compile
	});
};

function compile(source) 
{
	var token;
	var tokenizer = new dopple.Tokenizer(source);

	do {
		token = tokenizer.nextToken();
		console.log(token.print());
	} while(token.type !== dopple.TokenEnum.EOF);

	//console.log(dopple.compile(source));
};