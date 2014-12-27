"use strict";

var Compiler = {};

Compiler.Basic = dopple.Class.extend
({
	_init: function(lexer) 
	{
		if(!lexer) {
			console.error("Compiler:", "Invalid lexer has been passed in the constructor.");
			return;
		}

		this.lexer = lexer;
	},

	compile: function(source)
	{
		this.output = "";
		
		if(this.lexer.read(source)) {
			this.global = this.lexer.global;
			this.funcs = this.lexer.funcs;
			this.emit();
		}

		return this.output;	
	},	

	emitNumBinaryExpr: function(expr) 
	{
		var lhsValue;
		if(expr.lhs.exprType === this.exprEnum.BINARY) 
		{
			if(expr.op === "*") {
				lhsValue = "(" + this.emitNumBinaryExpr(expr.lhs) + ")";
			}
			else {
				lhsValue = this.emitNumBinaryExpr(expr.lhs);
			}
		}
		else 
		{
			lhsValue = expr.lhs.value;
			if(Math.floor(lhsValue) === lhsValue) {
				lhsValue += ".0";
			}			
		}

		var rhsValue;
		if(expr.rhs.exprType === this.exprEnum.BINARY) {
			rhsValue = this.emitNumBinaryExpr(expr.rhs);
		}
		else 
		{
			rhsValue = expr.rhs.value;
			if(Math.floor(rhsValue) === rhsValue) {
				rhsValue += ".0";
			}
		}

		return lhsValue + " " + expr.op + " " + rhsValue;
	},	

	incTabs: function() {
		this.tabs += "\t";
	},

	decTabs: function() {
		this.tabs = this.tabs.substr(0, this.tabs.length - 1);
	},	


	//
	lexer: null,

	global: null,
	funcs: null,
	scope: null,

	error: null,

	tabs: "",
	output: "",
	outputBuffer: "",
	outputExpr: "",
	outputScope: "",

	outputPre: "",
	outputPost: "",
	outputLength: "",	

	stripDeadCode: false,

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
});
