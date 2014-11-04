"use strict";

var AST = {};

/* Core Expression */
AST.Core = dopple.Class.extend
({
	type: 0,
	exprType: 0
});

/* Number Expression */
AST.Number = AST.Core.extend
({
	init: function(value) {
		this.value = value;
	},

	type: VarEnum.NUMBER,
	exprType: ExprEnum.NUMBER,
	value: NaN
});

/* Var Expression */
AST.Var = AST.Core.extend
({
	init: function(name) {
		this.name = name;
	},

	exprType: ExprEnum.VAR,
	name: "",
	expr: null
});