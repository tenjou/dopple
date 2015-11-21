"use strict";

/* Number */
meta.class("dopple.AST.Number",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	type: dopple.Type.NUMBER,
	exprType: dopple.ExprType.NUMBER,
	value: 0,
});


/* bool */
meta.class("dopple.AST.Bool",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	type: dopple.Type.BOOL,
	exprType: dopple.ExprType.BOOL,
	value: false
});

/* string */
meta.class("dopple.AST.String",
{
	init: function(value) 
	{
		if(value) {
			this.value = value;
		}
	},

	//
	type: dopple.Type.STRING,
	exprType: dopple.ExprType.STRING,
	value: ""
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
	exprType: dopple.ExprType.BINARY,
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
	exprType: dopple.ExprType.ASSIGN,
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
	exprType: dopple.ExprType.UPDATE,
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
	exprType: dopple.ExprType.SUBSCRIPT,
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
	exprType: dopple.ExprType.LOGICAL,
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
	exprType: dopple.ExprType.UNARY,
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
	type: dopple.Type.UNKNOWN,
	exprType: dopple.ExprType.VAR
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
	exprType: dopple.ExprType.REFERENCE,
	name: null,
	parents: null,	
});

/* if */
meta.class("dopple.AST.If", 
{
	Branch: function(scope, value) {
		this.scope = scope;
		this.value = value;
	},

	//
	exprType: dopple.ExprType.IF,
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
	exprType: dopple.ExprType.SWITCH,
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
	exprType: dopple.ExprType.SWITCH_CASE,
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
	exprType: dopple.ExprType.FOR,
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
	exprType: dopple.ExprType.FOR_IN,
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
	exprType: dopple.ExprType.WHILE,
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
	exprType: dopple.ExprType.DO_WHILE,
	test: null,
	bodyScope: null
});

/* continue */
meta.class("dopple.AST.Continue", 
{
	//
	exprType: dopple.ExprType.CONTINUE	
});

/* breka */
meta.class("dopple.AST.Break", 
{
	//
	exprType: dopple.ExprType.BREAK	
});

/* conditional */
meta.class("dopple.AST.Conditional",
{
	//
	exprType: dopple.ExprType.CONDITIONAL,
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
	exprType: dopple.ExprType.BLOCK
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
	exprType: dopple.ExprType.RETURN
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
	type: dopple.Type.FUNCTION,
	exprType: dopple.ExprType.FUNCTION,
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
	exprType: dopple.ExprType.FUNCTION_CALL,
	args: null
});

/* setter */
meta.class("dopple.AST.Setter",
{
	init: function(name, value)
	{
		this.name = name;
		this.value = value;
	},

	//
	exprType: dopple.ExprType.SETTER,

	name: null,
	value: null
});

/* getter */
meta.class("dopple.AST.Getter",
{
	init: function(name, value)
	{
		this.name = name;
		this.value = value;
	},

	//
	exprType: dopple.ExprType.GETTER,

	name: null,
	value: null
});

/* setter getter */
meta.class("dopple.AST.SetterGetter",
{
	init: function(name, setter, getter)
	{
		this.name = name;
		this.setter = setter;
		this.getter = getter;
	},

	//
	type: dopple.Type.SETTER_GETTER,
	exprType: dopple.ExprType.SETTER_GETTER,
	
	name: null,
	setter: null,
	getter: null
});

/* object */
meta.class("dopple.AST.Object",
{
	init: function(scope) {
		this.scope = scope;
	},

	//
	type: dopple.Type.CLASS,
	exprType: dopple.ExprType.OBJECT,
	scope: null
});

/* object property */
meta.class("dopple.AST.ObjectProperty",
{
	init: function(key, value) 
	{
		this.key = key;

		if(value) { this.value = value; }
	},

	//
	exprType: dopple.ExprType.OBJECT_PROPERTY,
	key: null,
	value: null
});

/* this */
meta.class("dopple.AST.This",
{
	exprType: dopple.ExprType.THIS,
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
	exprType: dopple.ExprType.NEW,
	func: null, 
	args: null
});

/* this */
meta.class("dopple.AST.Null",
{
	//
	type: dopple.Type.OBJECT,
	exprType: dopple.ExprType.NULL,
});

/* array */
meta.class("dopple.AST.Array",
{
	init: function(elements) 
	{
		if(elements) { this.elements = elements; }
	},

	//
	type: dopple.Type.ARRAY,
	exprType: dopple.ExprType.ARRAY,
	elements: null
});