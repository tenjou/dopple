"use strict";

/* basic */
meta.class("dopple.AST.Basic",
{
	//
	exprType: 0,
	subType: 0,
	flags: 0
});

/* number */
meta.class("dopple.AST.Number",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.ExprType.NUMBER,
	cls: null,
	value: 0
});


/* bool */
meta.class("dopple.AST.Bool",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.ExprType.BOOL,
	cls: null,
	value: false
});

/* string */
meta.class("dopple.AST.String",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.ExprType.STRING,
	cls: null,
	value: ""
});

/* param */
meta.class("dopple.AST.Param", "dopple.AST.Basic",
{
	//
	exprType: dopple.ExprType.PARAM,
	cls: null
});

/* args */
meta.class("dopple.AST.Args", "dopple.AST.Basic",
{
	//
	exprType: dopple.ExprType.ARGS,
	cls: null
});

/* binary */
meta.class("dopple.AST.Binary",
{
	init: function(lhs, rhs, op) {
		this.lhs = lhs;
		this.rhs = rhs;
		this.op = op;
	},

	//
	exprType: dopple.ExprType.BINARY,
	cls: null,
	op: "",
	lhs: null,
	rhs: null
});

/* identifier */
meta.class("dopple.AST.Identifier",
{
	init: function(value) 
	{
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.ExprType.IDENTIFIER,
	cls: null,
	value: ""
});

/* assign */
meta.class("dopple.AST.Assign", "dopple.AST.Basic",
{
	init: function(left, right, op) {
		this.left = left;
		this.right = right;
		this.op = op;
	},

	//
	exprType: dopple.ExprType.ASSIGN,
	cls: null,
	op: "=",
	left: null,
	right: null	
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

/* variable */
meta.class("dopple.AST.Var", 
{
	init: function(ref) 
	{
		if(ref) { this.ref = ref; }
	},

	//
	exprType: dopple.ExprType.VAR,
	cls: null,
	ref: null
});

/* reference */
meta.class("dopple.AST.Reference", 
{
	init: function(name, value) 
	{
		if(name) {
			this.name = name; 
		}

		if(value) 
		{ 
			this.value = value; 
			if(value.type) {
				this.type = value.type;
			}
		}
	},	

	//
	exprType: dopple.ExprType.REFERENCE,
	cls: null,

	name: null,
	value: null,
	scope: null
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
meta.class("dopple.AST.Function", "dopple.AST.Basic",
{
	init: function(name, scope, params) 
	{
		if(name) { this.name = name; }
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
	exprType: dopple.ExprType.FUNCTION,
	subType: dopple.SubType.FUNCTION,
	cls: null,
	argsIndex: -1,
	minParams: -1
});

/* function call */
meta.class("dopple.AST.FunctionCall",
{
	init: function(name, args) {
		this.name = name;
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
	exprType: dopple.ExprType.SETTER_GETTER,
	cls: null,
	
	name: null,
	setter: null,
	getter: null
});

/* class */
meta.class("dopple.AST.Class",
{
	init: function(name, scope, extend) 
	{
		this.name = name;
		this.scope = scope;

		if(this.extend) { this.extend = extend; }
	},

	//
	exprType: dopple.ExprType.CLASS,
	subType: dopple.SubType.OBJECT,
	cls: null,
	ast: null,
	id: 0,
	flags: 0,

	name: null,
	scope: null,
	constrFunc: null,
	extend: null
});

/* object */
meta.class("dopple.AST.Object",
{
	init: function(scope) {
		this.scope = scope;
		this.scope.staticVars = scope.vars;
	},

	//
	exprType: dopple.ExprType.OBJECT,
	cls: null,
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

/* member */
meta.class("dopple.AST.Member",
{
	init: function(left, right) {
		this.left = left;
		this.right = right;
	},

	//
	exprType: dopple.ExprType.MEMBER,
	cls: null,

	left: null,
	right: null
});

/* this */
meta.class("dopple.AST.This",
{
	exprType: dopple.ExprType.THIS,
});

/* new */
meta.class("dopple.AST.New", 
{
	init: function(name, args) {
		this.name = name;
		this.args = args;
	},	

	//
	exprType: dopple.ExprType.NEW,
	cls: null,

	name: null,
	args: null
});

/* this */
meta.class("dopple.AST.Null",
{
	//
	exprType: dopple.ExprType.NULL,
	cls: null
});

/* array */
meta.class("dopple.AST.Array",
{
	init: function(elements) 
	{
		if(elements) { this.elements = elements; }
	},

	//
	exprType: dopple.ExprType.ARRAY,
	cls: null,
	elements: null
});