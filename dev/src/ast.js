"use strict";

/* Number */
meta.class("dopple.AST.Number",
{
	init: function(value) 
	{
		if(value) { this.outputValue = value; }
	},

	//
	exprType: dopple.Type.NUMBER,
	outputValue: 0,
});


/* bool */
meta.class("dopple.AST.Bool",
{
	init: function(value) 
	{
		if(value) { this.outputValue = value; }
	},

	//
	exprType: dopple.Type.BOOL,
	outputValue: false
});

/* string */
meta.class("dopple.AST.String",
{
	init: function(value) 
	{
		if(value) {
			this.outputValue = value;
		}
	},

	//
	exprType: dopple.Type.STRING,
	outputValue: ""
});

/* binary */
meta.class("dopple.AST.Binary",
{
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;
	},

	//
	exprType: dopple.Type.BINARY,
	op: 0
});

/* assign */
meta.class("dopple.AST.Assign", 
{
	init: function(lhs, rhs, op) 
	{
		if(lhs) { this.lhs = lhs; }
		if(rhs) { this.value = rhs; }
		if(op) { this.op = op; }
	},

	//
	exprType: dopple.Type.ASSIGN,
	op: "="
});

/* update */
meta.class("dopple.AST.Update", 
{
	init: function(value, op) 
	{
		this.value = value;
		this.op = op;
	},

	//
	exprType: dopple.Type.UPDATE,
	value: null,
	op: ""
});

/* subscript */
meta.class("dopple.AST.Subscript",
{
	init: function(value, accessValue) 
	{
		this.value = value;
		this.accessValue = accessValue;
	},	

	//
	exprType: dopple.Type.SUBSCRIPT,
	value: null,
	accessValue: null
});

/* logical */
meta.class("dopple.AST.Logical",
{
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;
	},

	//
	exprType: dopple.Type.LOGICAL,
	op: 0
});

/* unary */
meta.class("dopple.AST.Unary",
{
	init: function(value, op) {
		this.value = value;
		this.op = op;
	},

	//
	exprType: dopple.Type.UNARY,
	op: 0
});

/* Var */
meta.class("dopple.AST.Var", 
{
	init: function(name, value) 
	{
		if(name) { this.name = name; }
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.Type.VAR
});

/* reference */
meta.class("dopple.AST.Reference", 
{
	init: function(name, parents) 
	{
		if(name) { this.name = name; }
		if(parents) { this.parents = parents; }
	},	

	//
	name: null,
	parents: null,
	exprType: dopple.Type.REFERENCE
});

/* if */
meta.class("dopple.AST.If", 
{
	Branch: function(scope, value) {
		this.scope = scope;
		this.value = value;
	},

	//
	exprType: dopple.Type.IF,
	branchIf: null,
	branchElseIf: null,
	branchElse: null
});

/* switch */
meta.class("dopple.AST.Switch", 
{
	init: function(discriminant, cases) {
		this.discriminant = discriminant;
		this.cases = cases;
	},

	//
	exprType: dopple.Type.SWITCH,
	discriminant: null,
	cases: null
});

/* switch case */
meta.class("dopple.AST.SwitchCase", 
{
	init: function(test, scope) 
	{
		if(this.test) { this.test = test; }

		this.scope = scope;
	},

	//
	exprType: dopple.Type.SWITCH_CASE,
	test: null,
	scope: null
});

/* for */
meta.class("dopple.AST.For", 
{
	Branch: function(initScope, updateScope, bodyScope) 
	{
		if(this.initScope) { this.initScope = initScope; }
		if(this.updateScope) { this.updateScope = updateScope; }
		if(this.bodyScope) { this.bodyScope = bodyScope; }
	},

	//
	exprType: dopple.Type.FOR,
	initScope: null,
	updateScope: null,
	bodyScope: null
});

/* for in */
meta.class("dopple.AST.ForIn", 
{
	Branch: function(initScope, updateScope, bodyScope) 
	{
		if(this.initScope) { this.initScope = initScope; }
		if(this.updateScope) { this.updateScope = updateScope; }
		if(this.bodyScope) { this.bodyScope = bodyScope; }
	},

	//
	exprType: dopple.Type.FOR_IN,
	initScope: null,
	updateScope: null,
	bodyScope: null
});

/* while */
meta.class("dopple.AST.While", 
{
	Branch: function(test, bodyScope) 
	{
		this.test = test;
		this.bodyScope = bodyScope;
	},

	//
	exprType: dopple.Type.WHILE,
	test: null,
	bodyScope: null
});

/* do while */
meta.class("dopple.AST.DoWhile", 
{
	Branch: function(test, bodyScope) 
	{
		this.test = test;
		this.bodyScope = bodyScope;
	},

	//
	exprType: dopple.Type.DO_WHILE,
	test: null,
	bodyScope: null
});

/* continue */
meta.class("dopple.AST.Continue", 
{
	//
	exprType: dopple.Type.CONTINUE	
});

/* breka */
meta.class("dopple.AST.Break", 
{
	//
	exprType: dopple.Type.BREAK	
});

/* conditional */
meta.class("dopple.AST.Conditional",
{
	//
	exprType: dopple.Type.CONDITIONAL,
	value: null,
	valueFail: null,
	test: null
});

/* block */
meta.class("dopple.AST.Block", 
{
	init: function(bodyScope) {
		this.bodyScope = bodyScope;
	},

	//
	exprType: dopple.Type.BLOCK
});

/* return */
meta.class("dopple.AST.Return", 
{
	init: function(value) 
	{
		if(value) {
			this.value = value;
		}
	},

	//
	exprType: dopple.Type.RETURN
});

/* function */
meta.class("dopple.AST.Function",
{
	init: function(name, parents, scope, params) 
	{
		if(name) { this.name = name; }
		if(parents) { this.parents = parents; }
		if(scope) { this.scope = scope; }
		if(params) 
		{ 
			this.params = params;

			var num = params.length; 
			this.minParams = num;

			var param;
			for(var n = 0; n < num; n++) 
			{
				param = params[n];
				if(param.flags & dopple.Flag.ARGS) { 
					this.minParams = n;
					this.argsIndex = n;
				}
				if(param.value) {
					this.minParams = n;
					break;
				}
			}
		}
	},

	//
	exprType: dopple.Type.FUNCTION,
	argsIndex: -1,
	minParams: -1
});

/* function call */
meta.class("dopple.AST.FunctionCall",
{
	init: function(name, parents, args) {
		this.name = name;
		this.parents = parents;
		this.args = args;
	},

	//
	exprType: dopple.Type.FUNCTION_CALL,
	args: null
});

/* object */
meta.class("dopple.AST.Object",
{
	init: function(key, value) 
	{
		if(key) { this.key = key; }
		if(value) { this.outputValue = value; }
	},

	//
	exprType: dopple.Type.OBJECT,
	key: null,
	value: null
});

/* this */
meta.class("dopple.AST.This",
{
	exprType: dopple.Type.THIS,
});

/* new */
meta.class("dopple.AST.New", 
{
	init: function(name, parents, args) {
		this.name = name;
		this.parents = parents || null;
		this.args = args || null;
	},	

	//
	exprType: dopple.Type.NEW,
	func: null, 
	args: null
});

/* array */
meta.class("dopple.AST.Array",
{
	init: function(elements) 
	{
		if(elements) { this.elements = elements; }
	},

	//
	exprType: dopple.Type.ARRAY,
	elements: null
});