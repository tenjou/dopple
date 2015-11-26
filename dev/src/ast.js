"use strict";

/* number */
meta.class("dopple.AST.Type",
{
	init: function(id, name, subType) 
	{
		this.id = id;
		this.name = name;
		this.subType = subType;
	},

	//
	exprType: dopple.ExprType.TYPE,

	id: 0,
	subType: 0,
	scope: null
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
	type: null,
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
	type: null,
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
	type: null,
	value: ""
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
	type: null,
	op: "",
	lhs: null,
	rhs: null
});

/* assign */
meta.class("dopple.AST.Assign", 
{
	init: function(lhs, rhs, op) {
		this.lhs = lhs;
		this.rhs = rhs;
		this.op = op;
	},

	//
	exprType: dopple.ExprType.ASSIGN,
	type: null,
	op: "=",
	lhs: null,
	rhs: null	
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
	exprType: dopple.ExprType.VAR,
	type: null
});

/* reference */
meta.class("dopple.AST.Reference", 
{
	init: function(name, type, value) 
	{
		if(name) { this.name = name; }
		if(type) { this.type = type; }
		if(value) { this.value = value; }
	},	

	//
	exprType: dopple.ExprType.REFERENCE,
	name: null,
	type: null,
	value: null
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
	exprType: dopple.ExprType.FUNCTION,
	type: null,
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
	init: function(name, scope)
	{
		this.name = name;
		this.scope = scope;
	},

	//
	exprType: dopple.ExprType.SETTER,

	name: null,
	scope: null
});

/* getter */
meta.class("dopple.AST.Getter",
{
	init: function(name, scope)
	{
		this.name = name;
		this.scope = scope;
	},

	//
	exprType: dopple.ExprType.GETTER,

	name: null,
	scope: null
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
	type: null,
	
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
	type: null,

	name: null,
	scope: null,
	extend: null
});

/* object */
meta.class("dopple.AST.Object",
{
	init: function(scope) {
		this.scope = scope;
	},

	//
	exprType: dopple.ExprType.OBJECT,
	type: null,
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
	init: function(nameExpr, valueExpr) {
		this.nameExpr = nameExpr;
		this.valueExpr = valueExpr;
	},

	//
	exprType: dopple.ExprType.MEMBER,

	nameExpr: null,
	valueExpr: null
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
	exprType: dopple.ExprType.NULL,
	type: null
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
	type: null,
	elements: null
});