"use strict";

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
		this.lookup["ForStatement"] = this.parseFor;
		this.lookup["AssignmentExpression"] = this.parseAssignExpr;
		this.lookup["SequenceExpression"] = this.parseSequenceExpr;
		this.lookup["BinaryExpression"] = this.parseBinaryExpr;
		this.lookup["ConditionalExpression"] = this.parseConditionalExpr;
		this.lookup["CallExpression"] = this.parseCallExpr;
		this.lookup["ObjectExpression"] = this.parseObjExpr;
		this.lookup["NewExpression"] = this.parseNewExpr;
		this.lookup["MemberExpression"] = this.parseMemberExpr;
		this.lookup["UnaryExpression"] = this.parseUnaryExpr;
		this.lookup["ArrayExpression"] = this.parseArrayExpr;
	},

	parse: function(scope, ast) 
	{
		this.scope = scope;

		this.nullExprCached = new dopple.AST.Null();

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
				return this.nullExprCached;
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
		var expr = new dopple.AST.New(node.callee.name, null, this.parseArgs(node.arguments));
		return expr;
	},

	parseMemberExpr: function(node) 
	{	
		var expr;
		if(node.computed) 
		{
			var accessValue = this.lookup[node.property.type].call(this, node.property);
			var value = this.lookup[node.object.type].call(this, node.object);
			expr = new dopple.AST.Subscript(value, accessValue);
		}
		else {
			this.parseName(node);
			expr = new dopple.AST.Reference(this.cache.name, this.cache.parents);
		}
		
		return expr;
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

		var varExpr = new dopple.AST.Var(node.id.name, value);
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
		this.scope.funcs.push(func);

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
		var prevScope = this.scope;
		var ifExpr = new dopple.AST.If();

		this.scope = prevScope.createVirtual();
		var value = this.lookup[node.test.type].call(this, node.test);
		this.parseBody(node.consequent.body);
		ifExpr.branchIf = new ifExpr.Branch(this.scope, value);

		var altNode = node.alternate;
		while(altNode) 
		{
			this.scope = prevScope.createVirtual();
			
			if(altNode.type === "BlockStatement") {
				this.parseBody(altNode.body);
				ifExpr.branchElse = new ifExpr.Branch(this.scope, null);
			}
			else 
			{
				this.parseBody(altNode.consequent.body);
				value = this.lookup[altNode.test.type].call(this, altNode.test);
				if(!ifExpr.branchElseIf) {
					ifExpr.branchElseIf = [ new ifExpr.Branch(this.scope, value) ];
				}
				else {
					ifExpr.branchElseIf.push(new ifExpr.Branch(this.scope, value));
				}
			}

			altNode = altNode.alternate;
		}

		this.scope = prevScope;

		return ifExpr;
	},


	parseConditionalExpr: function(node)
	{
		var condExpr = new dopple.AST.Conditional();
		condExpr.test = this.lookup[node.test.type].call(this, node.test);
		condExpr.value = this.lookup[node.consequent.type].call(this, node.consequent);
		condExpr.valueFail = this.lookup[node.alternate.type].call(this, node.alternate);
		return condExpr;
	},	

	parseAssignExpr: function(node)
	{
		var lhs = this.lookup[node.left.type].call(this, node.left);
		var rhs = this.lookup[node.right.type].call(this, node.right);

		var assignExpr = new dopple.AST.Assign(lhs, rhs, node.operator);
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

			var type;
			var parents = this.cache.parents;
			var objNode = node.object;
			for(;;) 
			{
				type = objNode.type;
				if(type === "MemberExpression")
				{
					parents.push(objNode.property.name);
					objNode = objNode.object;
				}
				else
				{
					console.log("smth");
					break;
				}
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

	parseArrayExpr: function(node)
	{
		var elementNode = null;
		var elements = node.elements;
		var num = elements.length;
		var buffer = (num > 0) ? new Array(num) : null;

		for(var n = 0; n < num; n++) {
			elementNode = elements[n];
			buffer[n] = this.lookup[elementNode.type].call(this, elementNode);
		}

		var arrayExpr = new dopple.AST.Array(buffer);
		return arrayExpr;
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
	nameLookup: {},

	scope: null,
	type: 0,

	nullExprCached: null,

	cache: {
		name: "",
		parents: null
	}
};

dopple.acorn.prepare();
