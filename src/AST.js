"use strict";

/* Base */
meta.class("dopple.AST.Base", 
{
	inheritFrom: function(node) 
	{
		this.cls = node.cls;

		if(node.flags & dopple.Flag.TEMPLATE) {
			this.templateValue = node.templateValue;
			this.flags |= dopple.Flag.TEMPLATE;
		}
		
		this.flags |= (node.flags & dopple.Flag.PTR);
		this.flags |= (node.flags & dopple.Flag.MEMORY_STACK);
		this.flags |= dopple.Flag.RESOLVED;		
	},

	//
	name: "",
	parents: null,
	type: dopple.Type.UNNOWN,
	cls: null,
	templateValue: null,
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

/* Array */
meta.class("dopple.AST.Array", "dopple.AST.Base", 
{
	init: function(elements) {
		this.elements = elements;
	},

	//
	type: dopple.Type.ARRAY,
	elements: null
});

dopple.AST.Array.prototype.flags |= dopple.Flag.TEMPLATE | dopple.Flag.MEMORY_STACK;

/* Null */
meta.class("dopple.AST.Null", "dopple.AST.Base", {
	type: dopple.Type.NULL
});

dopple.AST.Null.prototype.flags |= dopple.Flag.KNOWN;

/* Args */
meta.class("dopple.AST.Args", "dopple.AST.Base", {
	type: dopple.Type.ARGS
});

/* Template */
meta.class("dopple.AST.Template", "dopple.AST.Base", {
	type: dopple.Type.TEMPLATE
});

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
	init: function(name, parents, args) {
		this.name = name;
		this.parents = parents || null;
		this.args = args || null;
	},

	//
	type: dopple.Type.NEW,
	func: null, 
	args: null
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
		this.name = name || "";
		this.parents = parents || null;
		this.scope = scope || null;
		this.params = params || null;
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
	func: null,
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
		this.scope = scope || null;
	},

	//
	type: dopple.Type.CLASS,
	proto: null,
	constrBuffer: null,
	alt: "",
});

/* Mutator */
meta.class("dopple.AST.Mutator", "dopple.AST.Base", 
{
	init: function(name) {
		this.name = name;
	},

	//
	type: dopple.Type.MUTATOR
});

