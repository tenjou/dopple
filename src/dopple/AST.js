"use strict";

var AST = {};

/* Expression Basic */
AST.Basic = dopple.Class.extend
({
	analyse: function() { return true; },

	to: function(type) {
		return "void";
	},

	strType: function()
	{
		for(var key in this.varEnum) 
		{
			if(this.varEnum[key] === this.type) {
				return key;
			}
		}

		return "";
	},

	strExprType: function()
	{
		for(var key in this.exprEnum) 
		{
			if(this.exprEnum[key] === this.exprType) {
				return key;
			}
		}

		return "";
	},

	Flag: {
		RESOLVED: 1,
		RESOLVING: 2,
		ASSIGNED_FROM_MS: 4,
		ASSIGNED_FROM_VS: 8,
		GETTER: 16,
		SETTER: 32,
		EXTERN: 64
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

	//
	type: 0,
	exprType: 0,
	empty: false,
	flag: 0,
	numUses: 0,

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
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
	type: dopple.VarEnum.NUMBER,
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
	type: dopple.VarEnum.STRING,
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
	type: dopple.VarEnum.BOOL,
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

	analyse: function(resolver)
	{	
		if(!this.expr) { return true; }
		if(this.resolved) { return true; }
		
		var type = this.expr.exprType;
		if(type === this.exprEnum.BINARY) {
			this.type = this.expr.analyse(resolver);
		}
		else if(type === this.exprEnum.FUNCTION_CALL) 
		{
			if(!resolver.resolveFuncCall(this.expr)) {
				return false;
			}
			this.type = this.expr.func.type;
		}
		else if(type === this.exprEnum.FUNCTION) {
			this.type = this.varEnum.FUNCTION_PTR;			
		}
		else
		{
			if(this.type !== 0 && this.type !== this.expr.type) 
			{
				console.error("(INVALID_TYPE_CONVERSION) Can't convert a variable " + this.var.name + ":" + 
					this.var.strType() + " to " + this.expr.strType());
				return false;
			}
			
			this.type = this.expr.type;		
		}

		if(this.type === 0) {
			console.error("(Resolver) An expression with type 'void'");
			return false;
		}		

		this.resolved = true;

		return true;
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

/* Expression Binary */
AST.Binary = AST.Basic.extend
({
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;		
	},

	analyse: function(resolver)
	{
		var lhsType, rhsType;

		if(this.lhs.exprType === this.exprEnum.BINARY) {
			lhsType = this.lhs.analyse(resolver);
		}
		else 
		{
			if(this.lhs.exprType === this.exprEnum.FUNCTION_CALL) {
				resolver.resolveFuncCall(this.lhs);
				lhsType = this.lhs.func.type;
			}
			else {
				lhsType = this.lhs.type;
			}
		}

		if(this.rhs.exprType === this.exprEnum.BINARY) {
			rhsType = this.rhs.analyse(resolver);
		}
		else 
		{
			if(this.rhs.exprType === this.exprEnum.FUNCTION_CALL) {
				resolver.resolveFuncCall(this.rhs);
				rhsType = this.rhs.func.type;
			}
			else {
				rhsType = this.rhs.type;
			}
		}

		if(lhsType === rhsType) 
		{
			if(this.lhs.type === this.varEnum.BOOL && this.rhs.type === this.varEnum.BOOL) {
				this.type = this.varEnum.NUMBER;
			}
			else {
				this.type = lhsType;
			}

			return this.type;
		}

		if(lhsType === this.varEnum.STRING || rhsType === this.varEnum.STRING) {
			this.type = this.varEnum.STRING;
			return this.varEnum.STRING;
		}

		Error.throw(Error.Type.INVALID_TYPE_CONVERSION, this.lhs.strType() + " to " + this.rhs.strType());		

		return 0;
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
	type: dopple.VarEnum.NUMBER,
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

/* Expression Alloc */
AST.Alloc = AST.Basic.extend
({
	//
	exprType: dopple.ExprEnum.ALLOC
});

/* Expression Function */
AST.Function = AST.Basic.extend
({
	init: function(name, scope, params, parentList) 
	{
		this.name = name;
		this.scope = scope;
		this.params = params;
		this.numParams = (params) ? params.length : 0;
		this.parentList = parentList || null;
	},

	//
	exprType: dopple.ExprEnum.FUNCTION,

	name: "",
	rootName: null,
	obj: null
});

/* Expression Function Call */
AST.FunctionCall = AST.Basic.extend
({
	init: function(func, args) {
		this.func = func;
		if(args) { this.args = args; }
	},

	//
	exprType: dopple.ExprEnum.FUNCTION_CALL,

	func: null,
	args: null
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
	init: function(expr) {
		this.expr = expr;
	},

	//
	exprType: dopple.ExprEnum.RETURN,
	expr: null
});

/* Expression Name */
AST.Name = AST.Basic.extend
({
	init: function(str) {
		this.value = str || "";
	},

	defaultValue: function() {
		return "\"undefined\"";
	},

	//
	type: dopple.VarEnum.NAME,
	exprType: dopple.ExprEnum.NAME
});

/* Expression For */
AST.For = AST.Basic.extend
({
	init: function() {
		this.initExpr = null;
		this.cmpExpr = null;
		this.iterExpr = [];
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
	type: dopple.VarEnum.FORMAT,
	exprType: dopple.ExprEnum.FORMAT
});

/* Expression Class */
AST.Class = AST.Basic.extend
({
	init: function(name, scope) {
		this.name = name;
		this.scope = scope;
	},

	//
	type: 0,
	exprType: dopple.ExprEnum.CLASS,

	name: "",
	str: "[object Object]",
	scope: null,
	isStatic: true,

	constrFunc: null
});
