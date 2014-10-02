#!/bin/bash
cd ../src/
cat dopple.js \
	Error.js \
	Helper.js \
	Token.js \
	Tokenizer.js \
	Extern.js \
	Lexer.js \
	Optimizer.js \
	AST/Expression.js \
	AST/Expression.Number.js \
	AST/Expression.Bool.js \
	AST/Expression.String.js \
	AST/Expression.StringObj.js \
	AST/Expression.Var.js \
	AST/Expression.Binary.js \
	AST/Expression.Function.js \
	AST/Expression.FunctionCall.js \
	AST/Expression.Return.js \
	AST/Expression.Object.js \
	AST/Expression.Format.js \
	Compiler/Compiler.js \
	| uglifyjs --output ../lib/dopple.latest.js --mangle -c dead_code=false,unused=false,side_effects=false --screw-ie8
