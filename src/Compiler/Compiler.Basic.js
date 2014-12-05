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
	scopeInfo: null,

	error: null,

	tabs: "",
	output: "",
	outputBuffer: "",
	outputExpr: "",
	outputScope: "",

	outputPre: "",
	outputPost: "",
	outputLength: "",	

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
});

dopple.ScopeInfo = function() {
	this.parent = null;
	this.tmp_i32 = null;
	this.tmp_double = null;
	this.tmpID = 0;
};

dopple.ScopeInfo.prototype = 
{
	addTmpI32: function() 
	{
		if(!this.tmp_i32) {
			this.tmp_i32 = [];
		}

		var tmp = "__temp" + this.tmpID++;
		this.tmp_i32.push(tmp);
		return tmp;
	},

	addTmpDouble: function() 
	{
		if(!this.tmp_double) {
			this.tmp_double = [];
		}

		var tmp = "__temp" + this.tmpID++;
		this.tmp_double.push(tmp);
		return tmp;
	},	

	emitTmpI32: function() 
	{
		if(!this.tmp_i32) {
			return "";
		}

		var numTmps = this.tmp_i32.length;
		if(numTmps > 1)
		{
			var output = "";
			for(var i = 0; i < numTmps - 1; i++) {
				output += this.tmp_i32[i] + ", ";
			}
			output += this.tmp_i32[i];

			return output;
		}

		return this.tmp_i32[0];
	},

	emitTmpDouble: function() 
	{
		if(!this.tmp_double) {
			return "";
		}

		var numTmps = this.tmp_double.length;
		if(numTmps > 1)
		{
			var output = "";
			for(var i = 0; i < numTmps - 1; i++) {
				output += this.tmp_double[i] + ", ";
			}
			output += this.tmp_double[i];

			return output;
		}

		return this.tmp_double[0];
	}	
};
