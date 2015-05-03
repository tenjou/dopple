"use strict";

/* Base */
meta.class("dopple.AST.Base", 
{
	name: "",
	parents: null,
	type: dopple.Type.UNNOWN,
	cls: null,
	flags: 0
});

/* Number */
meta.class("dopple.AST.Number", "dopple.AST.Base", 
{
	init: function(num) {
		this.value = num;
	},

	//
	type: dopple.Type.NUMBER,
	value: 0,
});

dopple.AST.Number.prototype.flags |= dopple.Flag.KNOWN;

/* String */
meta.class("dopple.AST.String", "dopple.AST.Base", 
{
	init: function(str) {
		this.value = str;
	},

	//
	type: dopple.Type.STRING,
	value: ""
});

dopple.AST.String.prototype.flags |= dopple.Flag.KNOWN | dopple.Flag.PTR;

/* Bool */
meta.class("dopple.AST.Bool", "dopple.AST.Base", 
{
	init: function(value) {
		this.value = value;
	},

	//
	type: dopple.Type.BOOL,
	value: false
});

dopple.AST.Bool.prototype.flags |= dopple.Flag.KNOWN;

/* Null */
meta.class("dopple.AST.Null", "dopple.AST.Base", {
	type: dopple.Type.NULL
});

dopple.AST.Null.prototype.flags |= dopple.Flag.KNOWN | dopple.Flag.PTR;

/* Reference */
meta.class("dopple.AST.Reference", "dopple.AST.Base", 
{
	init: function(name, parents) {
		this.name = name;
		this.parents = parents;
	},

	//
	type: dopple.Type.REFERENCE,
	value: null
});

dopple.AST.Reference.prototype.flags |= dopple.Flag.HIDDEN;

/* New */
meta.class("dopple.AST.New", "dopple.AST.Base", 
{
	init: function(name, parents, params) {
		this.name = name;
		this.parents = parents;
		this.params = params;
	},

	//
	type: dopple.Type.NEW,
	value: null, 
	params: null
});

dopple.AST.New.prototype.flags |= dopple.Flag.PTR;

/* Binary */
meta.class("dopple.AST.Binary", "dopple.AST.Base", 
{
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;
	},

	//
	type: dopple.Type.BINARY,
	value: null, 
	op: 0
});

/* Var */
meta.class("dopple.AST.Var", "dopple.AST.Base", 
{
	init: function(name, parents, value) {
		this.name = name;
		this.parents = parents;
		this.value = value;
	},

	//
	type: dopple.Type.VAR,
	value: null
});

/* Assign */
meta.class("dopple.AST.Assign", "dopple.AST.Base", 
{
	init: function(name, parents, value, op) {
		this.name = name;
		this.parents = parents;
		this.value = value;
		this.op = op;
	},

	//
	type: dopple.Type.ASSIGN,
	value: null, 
	op: 0
});

/* Unary */
meta.class("dopple.AST.Unary", "dopple.AST.Base", 
{
	init: function(value, op) {
		this.value = value;
		this.op = op;
	},

	//
	type: dopple.Type.UNARY,
	value: null, 
	op: 0
});

/* Function */
meta.class("dopple.AST.If", "dopple.AST.Base", 
{
	init: function(scope) {
		this.scope = scope;
	},

	//
	type: dopple.Type.IF,
	value: null,
	scope: null
});

/* Function */
meta.class("dopple.AST.Function", "dopple.AST.Base", 
{
	init: function(name, parents, scope, params) {
		this.name = name;
		this.parents = parents;
		this.scope = scope;
		this.params = params;
	},

	//
	type: dopple.Type.FUNCTION,
	value: null,
	returnCls: null
});

/* Function Call */
meta.class("dopple.AST.FunctionCall", "dopple.AST.Base", 
{
	init: function(name, parents, args) {
		this.name = name;
		this.parents = parents;
		this.args = args;
	},

	//
	type: dopple.Type.FUNCTION_CALL,
	value: null,
	args: null
});

/* Return */
meta.class("dopple.AST.Return", "dopple.AST.Base", 
{
	init: function(value) {
		this.value = value;
	},

	//
	type: dopple.Type.RETURN,
	value: null
});

/* Class */
meta.class("dopple.AST.Class", "dopple.AST.Base", 
{
	init: function(name, scope) {
		this.name = name;
		this.alt = name;
		this.scope = scope;
	},

	//
	type: dopple.Type.CLASS,
	value: null,
	constr: null,
	alt: ""
});
