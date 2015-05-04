"use strict";

var dopple = 
{
	importAcorn: function(ast) 
	{
		this.scope = new dopple.Scope();

		this.resolver = new dopple.Resolver(this.scope);
		this.extern = new dopple.Extern(this.scope);
		this.extern.loadExterns();

		var createCall = new dopple.AST.FunctionCall("__dopple__create", null, null, null);
		this.scope.body.push(createCall);		

		dopple.acorn.parse(this.scope, ast);

		var destroyCall = new dopple.AST.FunctionCall("__dopple__destroy", null, null, null);
		this.scope.body.push(destroyCall);			
	},

	resolve: function() {
		this.resolver.do();
	},

	compile: function() 
	{
		var result = "";
		var compiler = dopple.compiler.cpp;

//		try {
//			try {
				compiler.prepare();
				this.resolve();
				//console.log(this.scope);
				result = compiler.compile();
			// }
			// catch(err) {
			// 	console.error(err);
			// }
		// }
		// catch(err) {
		// 	console.error(err);
		// }

		return result;
	},

	erorr: function(msg) {
		throw new SyntaxError(msg);
	},

	//
	scope: null,
	resolver: null,
	extern: null
};

dopple.Scope = function(parent) {
	this.parent = parent || null;
	this.vars = {};
	this.body = [];
	this.decls = [];
};

dopple.Scope.prototype = {
	virtual: false,
	funcs: null,
	returns: null,
	classes: []
};

dopple.Type = {
	UNKNOWN: 0,
	NUMBER: 1,
	STRING: 2,
	BOOL: 3,
	REFERENCE: 4,
	BINARY: 5,
	IF: 6,
	VAR: 7,
	ASSIGN: 8,
	FUNCTION: 9,
	FUNCTION_DEF: 10,
	FUNCTION_CALL: 11,
	CLASS: 12,
	CLASS_DEF: 13,
	NEW: 14,
	RETURN: 15,
	UNARY: 16,
	NULL: 17
};

dopple.Flag = {
	RESOLVED: 1,
	KNOWN: 2,
	PTR: 4,
	HIDDEN: 8,
	GLOBAL: 16,
	EXTERN: 32
};

dopple.acorn =  
{
	prepare: function() 
	{
		this.type = dopple.Type;

		this.lookup["Literal"] = this.parseLiteral;
		this.lookup["Identifier"] = this.parseIdentifier;
		this.lookup["Property"] = this.parseProperty;
		this.lookup["VariableDeclaration"] = this.parseVar;
		this.lookup["VariableDeclarator"] = this.parseVarDeclr;
		this.lookup["FunctionDeclaration"] = this.parseFunc;
		this.lookup["FunctionExpression"] = this.parseFuncExpr;
		this.lookup["EmptyStatement"] = this.parseEmpty;
		this.lookup["ExpressionStatement"] = this.parseExpr;
		this.lookup["ReturnStatement"] = this.parseReturn;
		this.lookup["IfStatement"] = this.parseIf;
		this.lookup["AssignmentExpression"] = this.parseAssignExpr;
		this.lookup["SequenceExpression"] = this.parseSequenceExpr;
		this.lookup["BinaryExpression"] = this.parseBinaryExpr;
		this.lookup["CallExpression"] = this.parseCallExpr;
		this.lookup["ObjectExpression"] = this.parseObjExpr;
		this.lookup["NewExpression"] = this.parseNewExpr;
		this.lookup["MemberExpression"] = this.parseMemberExpr;
		this.lookup["UnaryExpression"] = this.parseUnaryExpr;
	},

	parse: function(scope, ast) {
		this.scope = scope;
		this.parseBody(ast.body);
		return this.scope;
	},	

	parseBody: function(body) 
	{
		var node = null, expr = null;
		var numNodes = body.length;
		for(var i = 0; i < numNodes; i++) {
			node = body[i];
			expr = this.lookup[node.type].call(this, node);
			if(expr && expr.type !== this.type.FUNCTION_DEF) {
				this.scope.body.push(expr);
			}
		}
	},

	parseLiteral: function(node) 
	{
		if(typeof node.value === "string") {
			return new dopple.AST.String(node.value);
		}
		else 
		{
			if(node.raw === "false") {
				return new dopple.AST.Bool(0);
			}
			else if(node.raw === "true") {
				return new dopple.AST.Bool(1);
			}
			else if(node.raw === "null") {
				return new dopple.AST.Null();
			}

			return new dopple.AST.Number(node.value);
		}
	},

	parseIdentifier: function(node) {
		return new dopple.AST.Reference(node.name, null);
	},

	parseProperty: function(node) {
		var ref = this.lookup[node.key.type].call(this, node.key);
		ref.ref = this.lookup[node.value.type].call(this, node.value);
		return ref;
	},

	parseBinaryExpr: function(node) 
	{
		return new dopple.AST.Binary(
			node.operator, 
			this.lookup[node.left.type].call(this, node.left), 
			this.lookup[node.right.type].call(this, node.right));
	},

	parseNewExpr: function(node) {
		return new dopple.AST.New(node.callee.name, null, null);
	},

	parseMemberExpr: function(node) {
		this.parseName(node);
		return new dopple.AST.Reference(this.cache.name, this.cache.parents);
	},

	parseVar: function(node) {
		this.parseBody(node.declarations);
		return null;
	},

	parseVarDeclr: function(node) 
	{
		var value = null;
		if(node.init) {
			value = this.lookup[node.init.type].call(this, node.init);
		}

		var varExpr = new dopple.AST.Var(node.id.name, null, value);
		return varExpr;			
	},

	parseFuncExpr: function(node) {
		return this.parseFunc(node);
	},

	parseFunc: function(node) 
	{
		var scope = new dopple.Scope(this.scope);
		this.scope = scope;
		this.parseBody(node.body.body);

		var name = "";
		if(node.id) {
			name = node.id.name;
			this.scope.vars[name] = func;
		}
		
		var func = new dopple.AST.Function(name, null, scope, this.parseParams(node.params));
		func.type = this.type.FUNCTION_DEF;
		this.scope = this.scope.parent;
		this.scope.vars[name] = func;
		
		if(!this.scope.funcs) {
			this.scope.funcs = [ func ];
		}
		else {
			this.scope.funcs.push(func);
		}

		return func;
	},

	parseEmpty: function(node) {
		return null;
	},

	parseExpr: function(node) {
		return this.lookup[node.expression.type].call(this, node.expression);
	},

	parseReturn: function(node) {
		var value = this.lookup[node.argument.type].call(this, node.argument);
		var returnExpr = new dopple.AST.Return(value);
		return returnExpr;
	},

	parseIf: function(node)
	{
		var scope = new dopple.Scope(this.scope);
		scope.virtual = true;
		this.scope = scope;
		this.parseBody(node.consequent.body);
		this.scope = this.scope.parent;		

		var ifExpr = new dopple.AST.If(scope);
		ifExpr.value = this.lookup[node.test.type].call(this, node.test);
		return ifExpr;
	},

	parseAssignExpr: function(node)
	{
		this.parseName(node.left);

		var assignExpr = new dopple.AST.Assign(this.cache.name, this.cache.parents, null, node.operator);
		assignExpr.value = this.lookup[node.right.type].call(this, node.right);
		return assignExpr;
	},

	parseSequenceExpr: function(node) 
	{
		var exprNode = null, expr = null;
		var exprs = node.expressions;
		var num = exprs.length;
		for(var n = 0; n < num; n++) {
			exprNode = exprs[n];
			expr = this.lookup[exprNode.type].call(this, exprNode);
			if(expr && expr.type !== this.type.FUNCTION_DEF) {
				this.scope.body.push(expr);
			}
		}

		return null;
	},

	parseName: function(node)
	{
		this.cache.name = "";
		this.cache.parents = null;

		if(node.type === "Identifier") {
			this.cache.name = node.name;
		}
		else if(node.type === "MemberExpression") 
		{
			this.cache.name = node.property.name;
			this.cache.parents = [];

			var objNode = node.object;
			for(;;) {
				this.cache.parents.push(objNode.name);
				break;
			}
		}
	},

	parseCallExpr: function(node) 
	{
		this.parseName(node.callee);

		var funcCall = new dopple.AST.FunctionCall(this.cache.name, this.cache.parents, this.parseArgs(node.arguments));
		return funcCall;
	},

	parseObjExpr: function(node) 
	{
		var scope = new dopple.Scope(this.scope);
		this.scope = scope;
		this.parseBody(node.properties);
		this.scope = scope.parent;

		var objExpr = new dopple.AST.Class("", scope);
		objExpr.type = this.type.CLASS_DEF;
		return objExpr;
	},

	parseUnaryExpr: function(node) {
		var expr = this.lookup[node.argument.type].call(this, node.argument);
		var unaryExpr = new dopple.AST.Unary(expr, node.operator);
		return unaryExpr;
	},

	parseParams: function(paramNodes) 
	{
		var node = null;
		var param = null;
		var num = paramNodes.length;		
		var params = new Array(num);

		for(var n = 0; n < num; n++) {
			node = paramNodes[n];
			param = new dopple.AST.Reference(node.name, null);
			params[n] = param;
			this.scope.vars[param.name] = param;
		}

		return params;
	},

	parseArgs: function(argNodes)
	{
		var node = null;
		var arg = null;
		var num = argNodes.length;		
		var args = new Array(num);

		for(var n = 0; n < num; n++) {
			node = argNodes[n];
			arg = this.lookup[node.type].call(this, node);
			args[n] = arg;
		}

		return args;
	},

	//
	lookup: {},

	scope: null,
	type: 0,

	cache: {
		name: "",
		parents: null
	}
};

dopple.acorn.prepare();


