"use strict";

var Expression = {};

/* Expression Basic */
Expression.Basic = dopple.Class.extend
({
	analyse: function() {},

	to: function(type) {
		return "void";
	},

	strType: function()
	{
		var type = Variable.Type;

		for(var key in type) 
		{
			if(type[key] === this.type) {
				return key;
			}
		}

		return "";
	},

	strExprType: function()
	{
		var type = Variable.Type;

		for(var key in Expression.Type) 
		{
			if(type[key] === this.exprType) {
				return key;
			}
		}

		return "";
	},

	//
	type: 0,
	exprType: 0,

	exprEnum: dopple.ExprEnum,
	varEnum: dopple.VarEnum
});

/* Expression Number */
Expression.Number = Expression.Basic.extend
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
Expression.String = Expression.Basic.extend
({
	init: function(str) 
	{
		if(str) {
			this.str = str;
			this.length = str.length;
			this.hexLength = this.createHex();
		}
	},

	castTo: function(param)
	{
		if(this.type === param.type) {
			return "\"" + this.length + "\"\"" + this.value + "\"";
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

	//
	type: dopple.VarEnum.STRING,
	exprType: dopple.ExprEnum.STRING,

	value: "",
	length: 0,
	hexLength: ""
});

/* Expression Bool */
Expression.Bool = Expression.Basic.extend
({
	init: function(value) {
		this.value = value * 1;
	},

	//
	type: dopple.VarEnum.BOOL,
	exprType: dopple.ExprEnum.BOOL,
	value: 0
});

/* Expression Var */
Expression.Var = Expression.Basic.extend
({
	init: function(name, parentList, type)  
	{
		this.name = name || "unknown";
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
		var varEnum = dopple.varTypes;
		if(this.type === 0 || this.type === varEnum.NUMBER) {
			return "NaN";
		}
		else if(this.type === this.varEnum.NAME) {
			return "\"undefined\"";
		}
		else if(this.type === this.varEnum.STRING) {
			return "\"\\x9\\x0\\x0\\x0\"\"undefined\"";
		}
		else {
			throw "Expression.Var.defaultValue: Invalid conversion.";
		}
	},

	analyse: function()
	{	
		if(!this.expr) { return true; }
		
		if(this.expr.exprType === this.exprEnum.BINARY) {
			this.type = this.expr.analyse();
		}
		else
		{
			if(this.type !== 0 && this.type !== this.expr.type) 
			{
				console.error("INVALID_TYPE_CONVERSION: Can't convert a strict variable " + this.var.name + ":" + 
					this.var.strType() + " to " + this.expr.strType());
			}
			
			this.type = this.expr.type;
		}

		return true;
	},	

	//
	exprType: dopple.ExprEnum.VAR,

	name: "", 
	fullName: "",
	parentList: null,

	var: null,
	expr: null,
	value: ""
});

/* Expression Binary */
Expression.Binary = Expression.Basic.extend
({
	init: function(op, lhs, rhs) {
		this.op = op;
		this.lhs = lhs;
		this.rhs = rhs;		
	},

	analyse: function()
	{
		var lhsType, rhsType;

		if(this.lhs.exprType === this.exprEnum.BINARY) {
			lhsType = this.lhs.analyse();
		}
		else {
			lhsType = this.lhs.type;
		}

		if(this.rhs.exprType === this.exprEnum.BINARY) {
			rhsType = this.rhs.analyse();
		}
		else {
			rhsType = this.rhs.type;
		}

		if(lhsType === rhsType) {
			this.type = this.lhs.type;
			return lhsType;
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

/* Expression Function */
Expression.Function = Expression.Basic.extend
({
	init: function(name, scope, params, parentList) 
	{
		this.name = name;
		this.scope = scope;
		this.params = params;
		this.numParams = (params) ? params.length : 0;
		this.parentList = parentList || null;

		this.returnVar = new Expression.Var("");
	},

	//
	type: dopple.VarEnum.FUNCTION,
	exprType: dopple.ExprEnum.FUNCTION,

	name: "",
	rootName: null,
	returnVar: null,
});

/* Expression Function Call */
Expression.FunctionCall = Expression.Basic.extend
({
	init: function(func, args) {
		this.func = func;
		if(args) { this.args = args; }
	},

	//
	exprEnum: dopple.ExprEnum.FUNCTION_CALL,

	func: null,
	args: null
});

/* Expression Name */
Expression.Name = Expression.Basic.extend
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

/* Expression Format */
Expression.Format = Expression.Basic.extend
({
	init: function(name) {
		this.name = name;
	},

	defaultValue: function() {
		return '"\\n"';
	},

	//
	type: dopple.VarEnum.FORMAT,
	exprType: dopple.ExprEnum.FORMAT
});

/* Expression Class */
Expression.Class = Expression.Basic.extend
({
	init: function(name, scope) 
	{
		this.name = name;
		this.scope = scope;

		var scope = new dopple.Scope(scope);
		this.constructFunc = new Expression.Function(name, scope, []);			
	},

	//
	type: dopple.VarEnum.Class,
	exprEnum: dopple.ExprEnum.Class,

	name: "",
	str: "[object Object]",
	scope: null,
	isStatic: true,

	constructFunc: null
});
