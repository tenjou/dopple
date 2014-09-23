"use strict";

function Lexer()
{
	this.tokenizer = new Tokenizer();
	this.token = null;
	this.prevToken = null;

	this.optimizer = new Optimizer();

	this.precedence = {
		"=": 2,
		"<": 100,
		">": 100,
		"+": 200,
		"-": 200,
		"*": 400,
		"/": 400
	};

	this.global = new Scope();
	this.scope = this.global;

	this.genID = 0;
	this.currVar = null;

	this._skipNextToken = false;
};

Lexer.prototype = 
{
	read: function(buffer) 
	{
		//try {
			this.tokenizer.setBuffer(buffer);
			this.parseBody();
		//}
		//catch(str) {
		//	console.error(str);
		//	return false;
		//}

		return true;
	},

	nextToken: function() {
		this.token = this.tokenizer.token();
	},

	getTokenPrecendence: function()
	{
		if(this.token.type !== Token.Type.BINOP) {
			return -1;
		}

		var precendence = this.precedence[this.token.str];
		if(precendence === void(0)) {
			return -1;
		}

		return precendence;
	},


	parseBody: function()
	{
		var type;
		var tokenType = Token.Type;

		do
		{
			if(!this._skipNextToken) {
				this.nextToken();
			}
			else {
				this._skipNextToken = false;
			}

			type = this.token.type;
			if(type === tokenType.VAR) {
				this.parseVarExpr();
			}
			else if(type === tokenType.STRING) {
				this.parseVarExpr();
			}
			else if(type === tokenType.FUNCTION) {
				this.parseFunction();
			}
			else if(type === tokenType.RETURN) {
				this.parseReturn();
			}
			else
			{
				if(this.token.str === "/") 
				{
					this.nextToken();
					if(this.token.str === "/") {
						this.tokenizer.skipUntilNewline();
					}	
					else if(this.token.str === "*") {
						this.tokenizer.skipUntil("/");
					}		
					else {
						Lexer.throw(Lexer.Error.INVALID_REGEXP, this.token.str);
					}
				}
				else if(this.token.str === "\"") {
					this.tokenizer.skipUntil("\"");
				}
			}
		} while(this.token.type !== tokenType.EOF && this.token.str !== "}");
	},

	parseExpression: function()
	{
		var lhs = this.parsePrimary();
		if(!lhs) {
			return null;
		}

		return this.parseBinOpRHS(0, lhs);
	},

	parseBinOpRHS: function(exprPrecedence, lhs)
	{
		for(;;)
		{
			var precendence = this.getTokenPrecendence();
			if(precendence < exprPrecedence) {
				return lhs;
			}

			var binop = this.token.str;
			this.nextToken();

			var rhs = this.parsePrimary();
			if(!rhs) {
				return null;
			}

			var nextPrecedence = this.getTokenPrecendence();
			if(precendence < nextPrecedence) 
			{
				rhs = this.parseBinOpRHS(precendence + 1, rhs);
				if(!rhs) {
					return null;
				}
			}

			lhs = new Expression.Binary(binop, lhs, rhs);
		}

		return lhs;
	},

	parsePrimary: function()
	{
		if(this.token.type === Token.Type.NUMBER) {
			return this.parseNumber();
		}
		else if(this.token.type === Token.Type.STRING) {
			return this.parseVar();
		}
		else if(this.token.type === Token.Type.BOOL) {
			return this.parseBool();
		}
		else if(this.token.str === '"' || this.token.str === "'") {
			return this.parseString();
		}
		else if(this.token.str === "{") {
			return this.parseObject();
		}

		return null;
	},

	parseNumber: function() 
	{
		var expr = new Expression.Number(this.token.value);
		this.nextToken();
		return expr;
	},

	parseBool: function()
	{
		var expr = new Expression.Bool(this.token.value);
		this.nextToken();
		return expr;
	},

	parseString: function()
	{
		var endChar = this.token.str;

		var str = this.tokenizer.readUntil(endChar);
		if(this.tokenizer.currChar !== endChar) {
			return null;
		}

		var expr = new Expression.String(str);
		this.nextToken();
		return expr;
	},

	parseVar: function()
	{
		var variable = this.scope.vars[this.token.str];
		if(!variable) {
			Lexer.throw(Lexer.Error.REFERENCE_ERROR, this.token.str);
		}

		var expr = new Expression.Var(this.token.str);
		expr.var = variable;
		expr.type = variable.type;
		expr.value = this.token.str;
		this.nextToken();
		return expr;
	},

	parseObject: function()
	{
		var name = "";
		if(this.isGlobalScope) {
			name = "S" + this.currVar.name;
		}
		else {
			name = "__Sanonym" + this.genID++ + "__";
		}

		var objDef = new ObjectDef(name);
		var expr = new Expression.Object(name, objDef);
		// this.deffBuffer.push(expr);
		// this.defs[name] = expr;

		this.nextToken();

		if(this.token.str !== "}") {
			Lexer.throw(Lexer.Error.UNEXPECTED_EOI);
		}

		this.scope.defs[name] = objDef;
		this.scope.defBuffer.push(objDef);

		if(this.isGlobalScope) {
			//this.varBuffer.push(expr);
		}

		return expr;
	},

	parseVarExpr: function()
	{
		var initial = false;
		var definition = false;

		if(this.token.type !== Token.Type.STRING)
		{
			this.nextToken();	
			if(this.token.type !== Token.Type.STRING) {
				throw "Error";
			}

			initial = true;
		}

		var varName = this.token.str;
		this.nextToken();

		if(this.token.str === "(") {
			this.parseFuncCall(varName);
		}
		else
		{
			var varExpr = new Expression.Var(varName);

			var variable = this.scope.vars[varName];
			if(variable === void(0)) 
			{
				// No such variable defined.
				if(!initial) {
					Lexer.throw(Lexer.Error.REFERENCE_ERROR, varName);
				}

				variable = varExpr;
				definition = true;
				this.scope.vars[varName] = varExpr;
				this.scope.defBuffer.push(varExpr);
			}
			else {
				this.scope.varBuffer.push(varExpr);
			}

			varExpr.var = variable;
			this.currVar = variable;
			
			if(this.token.str === "=")
			{
				this.nextToken();
				varExpr.expr = this.parseExpression();
				varExpr.expr = this.optimizer.do(varExpr.expr);
				varExpr.analyse();

				if(definition && this.scope === this.global)
				{
					if(varExpr.expr.exprType === Expression.Type.BINARY) {
						this.scope.varBuffer.push(varExpr);
					}
				}
			}
		}
	},

	parseFuncCall: function(name)
	{
		var func = this.scope.vars[name];
		if(!func) {
			Lexer.throw(Lexer.Error.REFERENCE_ERROR, name);
		}
		var exprBuffer = null;

		this.nextToken();
		if(this.token.str !== ")") 
		{
			exprBuffer = [];

			var expr, param;
			for(var i = 0;; i++)
			{
				param = func.params[i];

				param.expr = this.parseExpression();
				param.expr = this.optimizer.do(param.expr);
				param.var = param.expr;
				param.analyse();
				exprBuffer.push(param.expr);

				if(this.token.str !== ",") {
					break;
				}
				this.nextToken();		
			}	
		}

		var funcCall = new Expression.FunctionCall(name, exprBuffer);
		this.scope.varBuffer.push(funcCall);
	},

	parseReturn: function()
	{
		var expr = null;
		var tokenType = Token.Type;

		this.nextToken();
		if(this.token.type === tokenType.VAR ||
		   this.token.type === tokenType.NUMBER ||
		   this.token.type === tokenType.STRING)
		{
			var varExpr = new Expression.Var("");
			varExpr.expr = this.parseExpression();
			varExpr.expr = this.optimizer.do(varExpr.expr);
			varExpr.var = varExpr.expr;
			varExpr.analyse();
		}

		var returnExpr = new Expression.Return(varExpr);
		this.scope.varBuffer.push(returnExpr);
	},

	parseFunction: function()
	{
		this.nextToken();
		var name = this.token.str;

		this.nextToken();
		if(this.token.str !== "(") {
			throw "Error: not (";
		}

		// Create a new scope.
		this.scope = new Scope(this.scope);	

		// Parse all variables.
		var newVar;
		var vars = [];
		this.nextToken();
		while(this.token.type === Token.Type.STRING) 
		{
			newVar = new Expression.Var(this.token.str);
			vars.push(newVar);
			this.scope.vars[newVar.name] = newVar;
			
			this.nextToken();
			if(this.token.str !== ",") 
			{
				if(this.token.str === ")") {
					break;
				}

				throw "Error: not ,";
			}

			this.nextToken();
		}

		if(this.token.str !== ")") {
			throw "Error: not )";
		}		

		this.nextToken();
		if(this.token.str !== "{") {
			Lexer.throw(Lexer.Error.UNEXPECTED_EOI);
		}		
		
		this.parseBody();
		
		if(this.token.str !== "}") {
			Lexer.throw(Lexer.Error.UNEXPECTED_EOI);
		}

		var funcExpr = new Expression.Function(name, this.scope, vars);
		var parentScope = this.scope.parent;
		parentScope.defBuffer.push(funcExpr);

		this.scope = this.scope.parent;

		this.nextToken();
		this._skipNextToken = true;
	},


	externFunc: function(name, params)
	{
		var funcParams = null;

		if(params) 
		{
			funcParams = [];

			var expr;
			var numParams = params.length;
			for(var i = 0; i < numParams; i += 2) 
			{
				expr = new Expression.Var(params[i + 1]);
				expr.type = params[i];
				funcParams.push(expr);
			}
		}

		var func = new Expression.Function(name, this.global, funcParams);
		this.global.vars[name] = func;
	}
};

function Scope(parent)
{
	this.parent = parent || null;

	this.defs = {};
	this.vars = {};
	this.defBuffer = [];
	this.varBuffer = [];
};
