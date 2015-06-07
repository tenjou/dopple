"use strict";

/* Type */
meta.class("dopple.AST.Type", 
{
	init: function(name, type, nativeType) {
		this.name = name;
		this.alt = name;
		this.type = type;
		this.nativeType = nativeType;
	},

	createTemplate: function(node) 
	{
		var templateType;
		if(node) {
			templateType = new dopple.AST.TemplateType(node.type, node.getTemplate());
		}
		else {
			templateType = new dopple.AST.TemplateType(null, null);
		}

		return templateType;
	},

	set ast(ast) {
		this._ast = ast;
		ast.prototype.type = this;
		ast.prototype.flags = this.flags;
	},

	get ast() { 
		return this._ast; 
	},

	//
	name: "",
	alt: "",
	type: dopple.Type.UNKNOWN,
	nativeType: dopple.Type.UNKNOWN,
	cls: null,
	_ast: null,
	flags: 0
});

/* Template Type */
meta.class("dopple.AST.TemplateType", 
{
	init: function(type, templateType) {
		this.type = type;
		this.templateType = templateType;
	},

	//
	type: null,
	templateType: null
});

/* Base */
meta.class("dopple.AST.Base", 
{
	inheritFrom: function(node) 
	{
		var flagTypes = dopple.Flag;

		if(node) {
			this.type = node.type;
			this.flags = node.type.flags;
		}	

		this.flags |= flagTypes.RESOLVED;
	},

	setTemplate: function(template) {
		this.templateType = template;
	},

	getTemplate: function() { 
		return this.templateType; 
	},

	//
	parents: null,
	type: null,
	templateType: null,
	exprType: dopple.Type.UNKNOWN,
	value: null,
	parent: null,
	hook: null,
	flags: 0
});

/* Void */
meta.class("dopple.AST.Void", "dopple.AST.Base", {});

/* Number */
meta.class("dopple.AST.Number", "dopple.AST.Base", 
{
	init: function(value) 
	{
		if(value) {
			this.outputValue = value;
		}
	},

	//
	exprType: dopple.Type.NUMBER,
	outputValue: 0,
});

/* String */
meta.class("dopple.AST.String", "dopple.AST.Base", 
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

/* Bool */
meta.class("dopple.AST.Bool", "dopple.AST.Base", 
{
	init: function(value) 
	{
		if(value) {
			this.outputValue = value;
		}
	},

	//
	exprType: dopple.Type.BOOL,
	outputValue: false
});

/* Array */
meta.class("dopple.AST.Array", "dopple.AST.Base", 
{
	init: function(elements) {
		this.elements = elements;
	},

	//
	exprType: dopple.Type.ARRAY,
	elements: null
});

/* Null */
meta.class("dopple.AST.Null", "dopple.AST.Base", {
	exprType: dopple.Type.NULL
});

/* Args */
meta.class("dopple.AST.Args", "dopple.AST.Base", {
	exprType: dopple.Type.ARGS
});

/* Array Args */
meta.class("dopple.AST.ArrayArgs", "dopple.AST.Base", {
	exprType: dopple.Type.ARRAY_ARGS
});

/* Template */
meta.class("dopple.AST.Template", "dopple.AST.Base", {
	exprType: dopple.Type.TEMPLATE
});

/* Reference */
meta.class("dopple.AST.Reference", "dopple.AST.Base", 
{
	init: function(name, parents) 
	{
		if(name) { this.name = name; }
		if(parents) { this.parents = parents; }
	},

	setTemplate: function(template) {
		this.value.setTemplate(template);
	},

	getTemplate: function() { 
		return this.value.getTemplate(); 
	},	

	//
	exprType: dopple.Type.REFERENCE
});

/* Param */
meta.class("dopple.AST.Param", "dopple.AST.Base", 
{
	init: function(name, parents)
	{
		if(name) { this.name = name; }
		if(parents) { this.parents = parents; }
	},	

	//
	exprType: dopple.Type.PARAM,
	defaultValue: null
});

/* New */
meta.class("dopple.AST.New", "dopple.AST.Base", 
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

/* Binary */
meta.class("dopple.AST.Binary", "dopple.AST.Base", 
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

/* Var */
meta.class("dopple.AST.Var", "dopple.AST.Base", 
{
	init: function(name, value) 
	{
		if(name) { this.name = name; }
		if(value) { this.value = value; }
	},

	//
	exprType: dopple.Type.VAR
});

/* Assign */
meta.class("dopple.AST.Assign", "dopple.AST.Base", 
{
	init: function(lhs, rhs, op) 
	{
		if(lhs) { this.lhs = lhs; }
		if(rhs) { this.value = rhs; }
		if(op) { this.op = op; }
	},

	setTemplate: function(template) {
		this.value.templateType = template;
	},

	getTemplate: function() { 
		return this.value.templateType; 
	},	

	//
	exprType: dopple.Type.ASSIGN,
	op: "="
});

/* Unary */
meta.class("dopple.AST.Unary", "dopple.AST.Base", 
{
	init: function(value, op) {
		this.value = value;
		this.op = op;
	},

	//
	exprType: dopple.Type.UNARY,
	op: 0
});

/* Function */
meta.class("dopple.AST.If", "dopple.AST.Base", 
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

/* Conditional */
meta.class("dopple.AST.Conditional", "dopple.AST.Base", 
{
	//
	exprType: dopple.Type.CONDITIONAL,
	value: null,
	valueFail: null,
	test: null
});

/* Function */
meta.class("dopple.AST.Function", "dopple.AST.Base", 
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

/* Function Call */
meta.class("dopple.AST.FunctionCall", "dopple.AST.Base", 
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

/* Return */
meta.class("dopple.AST.Return", "dopple.AST.Base", 
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

/* Class */
meta.class("dopple.AST.Class", "dopple.AST.Base", 
{
	init: function(name, scope) 
	{
		if(name) {
			this.name = name;		
		}
		if(scope) {
			this.scope = scope;
		}
	},

	//
	exprType: dopple.Type.CLASS,
	scope: null,
	proto: null,
	constrBuffer: null
});

/* Mutator */
meta.class("dopple.AST.Mutator", "dopple.AST.Base", 
{
	init: function(name) 
	{
		if(name) { this.name = name; }
	},

	//
	exprType: dopple.Type.MUTATOR
});

/* Subscript */
meta.class("dopple.AST.Subscript", "dopple.AST.Base", 
{
	init: function(value, accessValue) 
	{
		if(value) { this.value = value; }
		if(accessValue) { this.accessValue = accessValue; }
	},


	setTemplate: function(template) {
		this.value.setTemplate(template);
	},

	getTemplate: function() { 
		return this.value.getTemplate(); 
	},		

	//
	exprType: dopple.Type.SUBSCRIPT,
	accessValue: null
});
