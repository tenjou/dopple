"use strict";

var AST = {};

/* Expression Basic */
AST.Basic = dopple.Class.extend
({
	_init: function() {
		this.line = dopple.lexer.line;
	},

	analyse: function() { return true; },

	to: function(type) {
		return "void";
	},

	Flag: {
		RESOLVED: 1,
		RESOLVING: 2,
		ASSIGNED_FROM_MS: 4,
		ASSIGNED_FROM_VS: 8,
		GETTER: 16,
		SETTER: 32,
		EXTERN: 64,
		HIDDEN: 128
	},

	setFlag: function(value, flag) 
	{
		if(value) {
			this.flag |= flag;
		}
		else {
			this.flag &= ~flag;
		}
	},

	set resolved(value) {
		this.setFlag(value, this.Flag.RESOLVED);
	},

	get resolved() { 
		return (this.flag & this.Flag.RESOLVED) === this.Flag.RESOLVED;
	},

	set resolving(value) {
		this.setFlag(value, this.Flag.RESOLVING);
	},

	get resolving() { 
		return (this.flag & this.Flag.RESOLVING) === this.Flag.RESOLVING;
	},

	set extern(value) {
		this.setFlag(value, this.Flag.EXTERN);
	},

	get extern() { 
		return (this.flag & this.Flag.EXTERN) === this.Flag.EXTERN;
	},

	set hidden(value) 
	{
		if(value) {
			this.flag |= this.Flag.HIDDEN;
		}
		else {
			this.flag &= ~this.Flag.HIDEEN;
		}
	},

	get hidden() { return (this.flag & this.Flag.HIDDEN); },

	//
	type: 0,
	exprType: 0,
	flag: 0,
	numUses: 0,

	line: 0,

	exprEnum: dopple.ExprEnum,
	varEnum: dopple._VarEnum
});

/* Expression Number */
AST.Number = AST.Basic.extend
({
	init: function(value) {
		this.value = value;
	},

	castTo: function(param)
	{
		if(this.type === param.type) {
			return this.value;
		}
		else 
		{
			if(param.type === this.varEnum.NAME) {
				return "\"" + this.value + "\"";
			}
			else if(param.type === this.varEnum.STRING) {
				return "\"" + param.var.hexLength(this.value) + "\"\"" + this.value + "\"";
			}
			else {
				dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, this);
			}		
		}
	},

	defaultValue: function() {
		return "NaN";
	},	

	//
	value: 0,
	type: dopple._VarEnum.NUMBER,
	exprType: dopple.ExprEnum.NUMBER
});

/* Expression String */
AST.String = AST.Basic.extend
({
	init: function(str) 
	{
		if(str) {
			this.value = str;
			this.length = str.length;
		}
	},

	castTo: function(param)
	{
		if(this.type === param.type) {
			return "\"" + this.createHex() + "\"\"" + this.value + "\"";
		}
		else 
		{
			if(param.type === this.varEnum.NUMBER) {
				var num = Number(this.value) || -1;
				return num;
			}		
			if(param.type === this.varEnum.NAME) {
				return "\"" + this.value + "\"";
			}
			else 
			{
				dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, 
					"\"" + param.name + "\" from " + this.strType() + " to " + param.strType());
			}		
		}
	},

	defaultValue: function() {
		return "\"\\x9\\x0\\x0\\x0\"\"undefined\"";
	},

	createHex: function() {
		return ToHex(this.length) + "\\x0\\x0\\x0";
	},	

	set value(str) {
		this._value = str;
		this.length = str.length;
	},

	get value() { return this._value; },

	//
	type: dopple._VarEnum.STRING,
	exprType: dopple.ExprEnum.STRING,

	_value: "",
	length: 0
});

/* Expression Bool */
AST.Bool = AST.Basic.extend
({
	init: function(value) {
		this.value = value * 1;
	},

	castTo: function(param)
	{
		if(this.type === param.type) {
			return this.value;
		}
		else 
		{
			if(param.type === this.varEnum.NAME) {
				return "\"" + this.value + "\"";
			}
			else if(param.type === this.varEnum.STRING) {
				return "\"" + param.var.hexLength(this.value) + "\"\"" + this.value + "\"";
			}
			else {
				dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, this);
			}		
		}
	},	

	str: function() 
	{
		if(typeof this.value === "string") {
			return this.value;
		}

		if(this.value > 0) {
			return "true"
		}
		
		return "false";
	},

	//
	type: dopple._VarEnum.BOOL,
	exprType: dopple.ExprEnum.BOOL,
	value: 0
});

/* Expression Var */
AST.Var = AST.Basic.extend
({
	init: function(name, parentList, type)  
	{
		if(name) { this.value = name; }
		this.parentList = parentList || null;
		this.type = type || 0;
	},

	castTo: function(param)
	{
		if(this.type === param.type) {
			return this.value;
		}
		else 
		{
			if(param.type === this.varEnum.NAME) 
			{
				if(this.type === this.varEnum.STRING) {
					return this.value + " + sizeof(int32_t)";
				}
				else {
					return this.value;				
				}
			}
			else 
			{
				dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, 
					"\"" + param.name + "\" from " + this.strType() + " to " + param.strType());
			}		
		}
	},

	defaultValue: function() 
	{
		if(this.type === 0 || this.type === this.varEnum.NUMBER) {
			return "NaN";
		}
		else if(this.type === this.varEnum.NAME) {
			return "\"undefined\"";
		}
		else if(this.type === this.varEnum.STRING) {
			return "\"\\x9\\x0\\x0\\x0\"\"undefined\"";
		}
		else {
			throw "AST.Var.defaultValue: Invalid conversion.";
		}
	},

	//
	exprType: dopple.ExprEnum.VAR,

	fullName: "",
	parentList: null,

	var: null,
	op: "",
	expr: null,
	value: "unknown",
	isDef: false,
	isArg: false
});

/* Expression Name */
AST.Name = AST.Basic.extend
({
	init: function(varExpr, parentList) {
		this.value = name;
		this.parentList = parentList;
	},

	//
	value: "<unknown>",
	exprType: dopple.ExprEnum.NAME,
	varExpr: null
});

/* Expression Binary */
AST.Binary = AST.Basic.extend
({
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;		
	},

	//
	exprType: dopple.ExprEnum.BINARY,

	op: "",
	lhs: null,
	rhs: null
});

/* Expression Unary Operator */
AST.Unary = AST.Basic.extend
({
	castTo: function(param)
	{
		if(this.type === param.type) 
		{
			if(this.pre) {
				return this.op + this.varExpr.value;
			}
			return this.varExpr.value + this.op;
		}
		else {
			dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, this);		
		}
	},

	//
	type: dopple._VarEnum.NUMBER,
	exprType: dopple.ExprEnum.UNARY,

	varExpr: null,
	op: "",
	pre: false
});

/* Expression If */
AST.If = AST.Basic.extend
({
	init: function() {
		this.branches = [];
	},

	addBranch: function(type, expr, scope) {
		this.branches.push(new this.Branch(type, expr, scope));
	},

	Branch: function(type, expr, scope) {
		this.type = type;
		this.expr = expr;
		this.scope = scope;
	},

	//
	exprType: dopple.ExprEnum.IF,
	branches: null
});

/* Expression Function */
AST.Function = AST.Basic.extend
({
	init: function(name, scope, params, parentList) 
	{
		this.name = name;
		this.scope = scope;
		this.parentList = parentList || null;

		if(params) 
		{
			this.params = params;
			this.numParams = params.length;

			for(var i = 0; i < this.numParams; i++) 
			{
				if(this.params.type === this.varEnum.ARGS) {
					this.argsIndex = i;
					break;
				}
			}
		}
	},

	//
	exprType: dopple.ExprEnum.FUNCTION,

	name: "",
	rootName: null,
	params: null,
	numParams: 0,
	cls: null,

	argsIndex: -1
});

/* Expression Function Call */
AST.FunctionCall = AST.Basic.extend
({
	init: function(name, parentList, args) 
	{
		this.name = name || "";
		this.parentList = parentList || null;

		if(args) {
			this.args = args;
			this.numArgs = args.length;
		}
	},

	//
	exprType: dopple.ExprEnum.FUNCTION_CALL,

	name: "",
	parentList: null,
	args: null,
	numArgs: 0,
	func: null
});

/* Expression Mutator */
AST.Mutator = AST.Basic.extend
({
	init: function(name, scope, paramExpr, returnExpr) 
	{
		this.name = name;
		this.scope = scope;

		if(paramExpr) {
			this.paramExpr = paramExpr;
			this.flag |= this.Flag.SETTER;
		}

		if(returnExpr) {
			this.returnExpr = returnExpr;
			this.flag |= this.Flag.GETTER;
		}
	},

	//
	exprType: dopple.ExprEnum.MUTATOR,
	name: "",
	scope: null,
	paramExpr: null,
	returnExpr: null
});

/* Expression Getter */
AST.Getter = AST.Basic.extend
({
	//
	exprEnum: dopple.ExprEnum.GETTER
});

/* Expression Setter */
AST.Setter = AST.Basic.extend
({
	//
	exprEnum: dopple.ExprEnum.SETTER
});

/* Expression Function Call */
AST.Return = AST.Basic.extend
({
	init: function(varExpr) {
		this.varExpr = varExpr;
	},

	//
	exprType: dopple.ExprEnum.RETURN,
	varExpr: null
});

/* Expression For */
AST.For = AST.Basic.extend
({
	init: function() {
		this.initExpr = null;
		this.cmpExpr = null;
		this.iterExpr = null;
	},

	//
	exprType: dopple.ExprEnum.FOR,

	initExpr: null,
	cmpExpr: null,
	iterExpr: null,

	scope: null
});

/* Expression Format */
AST.Format = AST.Basic.extend
({
	defaultValue: function() {
		return '"\\n"';
	},

	//
	type: dopple._VarEnum.FORMAT,
	exprType: dopple.ExprEnum.FORMAT
});

/* Expression Class */
AST.Class = AST.Basic.extend
({
	init: function(name) {
		this.name = name;
	},

	//
	type: dopple._VarEnum.OBJECT,
	exprType: dopple.ExprEnum.CLASS,

	name: "",
	str: "[object Object]",
	scope: null,
	isStatic: true,

	constrFunc: null,
	childParentList: null
});

/* Expression Alloc */
AST.Alloc = AST.Basic.extend
({
	init: function(cls) {
		this.cls = cls;
	},

	//
	type: dopple._VarEnum.OBJECT,
	exprType: dopple.ExprEnum.ALLOC,

	cls: null,
	constrCall: null
});

/* Expression This */
AST.This = AST.Basic.extend
({
	init: function(cls) {
		this.cls = cls;
	},

	//
	type: dopple._VarEnum.OBJECT,
	exprType: dopple.ExprEnum.THIS,

	cls: null,
	value: "this",
	name: "this"
});


