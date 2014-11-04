"use strict";

function Lexer()
{
	this.tokenizer = null;
	this.token = null;
	this.prevToken = null;

	this.global = new dopple.Scope();
	this.scope = this.global;	

	this.optimizer = new Optimizer();
	this.extern = new dopple.Extern(this);

	this.precedence = {
		"=": 2,
		"<": 100,
		">": 100,
		"+": 200,
		"-": 200,
		"*": 400,
		"/": 400
	};

	this.genID = 0;
	this.currName = "";
	this.currVar = null;
	this.parentList = null;

	this._skipNextToken = false;

	this.tokenEnum = dopple.TokenEnum;
	this.varEnum = Variable.Type;
	this.exprEnum = Expression.Type;
};

Lexer.prototype = 
{
	read: function(buffer) 
	{
//		try {
			this.tokenizer = new dopple.Tokenizer(buffer);
			this.parseBody();
		// }
		// catch(str) {
		// 	console.error(str);
		// 	return false;
		// }

		return true;
	},

	nextToken: function() {
		this.token = this.tokenizer.nextToken();
	},

	getTokenPrecendence: function()
	{
		if(this.token.type !== this.tokenEnum.BINOP) {
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
		do
		{
			if(!this._skipNextToken) {
				this.nextToken();
			}
			else {
				this._skipNextToken = false;
			}

			type = this.token.type;
			if(type === this.tokenEnum.NAME || 
			   type === this.tokenEnum.VAR) 
			{
				this.parseVar();
			}
			else if(type === this.tokenEnum.FUNCTION) {
				this.parseFunc();
			}
			else if(type === this.tokenEnum.RETURN) {
				this.parseReturn();
			}
		} while(this.token.type !== this.tokenEnum.EOF && this.token.str !== "}");
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
		if(this.token.type === this.tokenEnum.NUMBER) {
			return this.parseNumber();
		}
		else if(this.token.type === this.tokenEnum.NAME) {
			return this.parseName();
		}
		else if(this.token.type === this.tokenEnum.STRING) {
			return this.parseString();
		}		
		else if(this.token.type === this.tokenEnum.BOOL) {
			return this.parseBool();
		}
		else if(this.token.type === this.tokenEnum.FUNCTION) {
			return this.parseFunc();
		}
		else if(this.token.str === "{") {
			return this.parseObject();
		}
			
		this.handleTokenError();
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

	parseName: function()
	{
		var varName = this.token.str;
		var expr = this.scope.vars[varName];
		if(!expr) {
			dopple.throw(dopple.Error.REFERENCE_ERROR, varName);
		}

		var parentList = null;
		var scope = expr.scope;
		
		this.nextToken();
		if(this.token.str === ".") 
		{
			parentList = [ expr ];

			this.nextToken();
			do
			{
				if(this.token.type !== this.tokenEnum.NAME) {
					this.handleTokenError();
				}

				varName = this.token.str;
				expr = scope.vars[varName];
				if(!expr) {
					dopple.throw(dopple.Error.REFERENCE_ERROR, varName);
				}

				this.nextToken();		
			} while(this.token.str === ".");
		}

		var varExpr = new Expression.Var(varName, parentList);
		varExpr.expr = varExpr;
		varExpr.var = expr;
		varExpr.type = expr.type;
		varExpr.value = varName;
		return varExpr;
	},

	parseString: function()
	{
		var expr = new Expression.StringObj(this.token.str);
		this.nextToken();
		return expr;
	},	

	parseVar: function()
	{
		var initial = false;
		if(this.token.type === this.tokenEnum.VAR)
		{
			this.nextToken();	
			if(this.token.type !== this.tokenEnum.NAME) {
				this.handleTokenError();
			}

			initial = true;
		}

		this.currName = this.token.str;
		this.nextToken();

		if(this.token.str === "(") {
			this.parseFuncCall();
		}
		else if(this.token.str === ".") 
		{
			// Invalid if initialized as: var <objName>.<memberName>
			if(initial) {
				dopple.throw(dopple.Error.UNEXPECTED_TOKEN, this.token.str);
			}

			this.parseParentList();

			if(this.token.str === "=") {
				this._defineObjVar();
			}
			else if(this.token.str === "(") {
				this.parseFuncCall();
			}
			else {
				throw "Lexer::parseVar: Unhandled case!";
			}

			this.parentList = null;
		}
		else
		{	
			if(this.token.str === "=")
			{
				this.nextToken();

				var expr = this.parseExpression();
				if(expr.exprType !== this.exprEnum.OBJECT &&
				   expr.exprType !== this.exprEnum.FUNCTION) 
				{
					this._defineVar(expr, initial);			
				}
			}
			else 
			{
				if(!initial && this.token.type === this.tokenEnum.NAME) {
					this.handleTokenError();
				}
				else if(initial && this.token.type === this.tokenEnum.SYMBOL) {
					this.handleUnexpectedToken();
				}

				this._defineVar(null, initial);
			}
		}

		this.currName = "";
	},	

	_defineVar: function(expr, initial)
	{
		// Ignore if it's not a definition and without a body.
		if(!expr && !initial) {
			this.getExprFromVar(this.scope, this.currName);
			return;
		}

		var varExpr = new Expression.Var(this.currName, this.parentList);
		var scopeVarExpr = this.scope.vars[this.currName];
		var definition = false;

		// Expression is function:
		if(expr && expr.exprType === this.exprEnum.FUNCTION)
		{
			if(scopeVarExpr) {
				dopple.throw(dopple.Error.UNSUPPORTED_FEATURE, "Redefining function pointer");
			}
		}
		//
		else
		{
			if(scopeVarExpr === void(0)) 
			{
				// No such variable defined.
				if(!initial) {
					dopple.throw(dopple.Error.REFERENCE_ERROR, this.currName);
				}

				definition = true;
				scopeVarExpr = varExpr;
				this.scope.vars[this.currName] = varExpr;
				this.scope.defBuffer.push(varExpr);
			}
			else {
				this.scope.varBuffer.push(varExpr);
			}

			varExpr.var = scopeVarExpr;
		}

		if(expr)
		{
			varExpr.expr = this.optimizer.do(expr);
			varExpr.analyse();

			if(definition && this.scope === this.global)
			{
				var exprType = varExpr.expr.exprType;
				if(exprType === this.exprEnum.BINARY || exprType === this.exprEnum.VAR) {
					this.scope.varBuffer.push(varExpr);
				}
			}

			if(this.token.str !== ";") {
				this._skipNextToken = true;
			}	
		}			
	},

	_defineObjVar: function()
	{
		var parentList = this.parentList;

		var objExpr = parentList[parentList.length - 1];
		this.scope = objExpr.scope;

		var memberExpr = this.scope.vars[this.currName];

		this.nextToken();		

		// If object don't have such variable - add as a definiton:
		if(!memberExpr) 
		{
			var expr = this.parseExpression();
			expr = this.optimizer.do(expr);

			if(expr.exprType === this.exprEnum.FUNCTION) {
				memberExpr = expr;
			}
			else
			{
				memberExpr = new Expression.Var(this.currName, parentList);
				memberExpr.var = memberExpr;

				var varExpr = new Expression.Var(this.currName, parentList);
				varExpr.expr = expr;
				varExpr.var = memberExpr;
				varExpr.analyse();
				memberExpr.type = varExpr.type;

				this.global.varBuffer.push(varExpr);
				this.scope.vars[this.currName] = memberExpr;	
				this.scope.defBuffer.push(memberExpr);				
			}	
		}
		else
		{	
			var varExpr = new Expression.Var(this.currName, parentList);
			varExpr.expr = this.parseExpression();
			varExpr.expr = this.optimizer.do(varExpr.expr);
			varExpr.var = memberExpr;
			varExpr.analyse();	

			this.scope.vars[this.currName] = varExpr;
			this.scope.varBuffer.push(varExpr);				
		}	

		this.scope = this.scope.parent;
	},

	parseObject: function()
	{
		var name = "";
		if(this.scope === this.global) {
			name = this.currName;
		}
		else {
			name = "__Sanonym" + this.genID++ + "__";
		}

		if(this.scope.vars[name]) {
			dopple.throw(dopple.Error.REDEFINITION, name);
		}

		var parentScope = this.scope;
		this.scope = new dopple.Scope(this.scope);

		var objExpr = new Expression.Object(name, this.scope);
		parentScope.vars[name] = objExpr;
		parentScope.defBuffer.push(objExpr);
		this.parentList = [ objExpr ];

		// Constructor:
		var initFunc = new Expression.Function("__init", this.scope, null, this.parentList);
		this.scope.vars["__init"] = initFunc;
		parentScope.defBuffer.push(initFunc);

		var initFuncCall = new Expression.FunctionCall(initFunc);
		parentScope.varBuffer.push(initFuncCall);

		// Parse object members:
		var varName, varExpr, expr;
		this.nextToken();
		while(this.token.str !== "}") 
		{
			if(this.token.type === this.tokenEnum.NAME ||
			   this.token.type === this.tokenEnum.STRING) 
			{
				this.currName = this.token.str;

				this.nextToken();
				if(this.token.str !== ":") {
					this.handleTokenError();
				}

				this.nextToken();
				expr = this.parseExpression();
				expr = this.optimizer.do(expr);
				if(expr.exprType === this.exprEnum.OBJECT) {
					dopple.throw(dopple.Error.UNSUPPORTED_FEATURE, "object inside an object")
				}

				if(this.token.str !== "," && this.token.str !== "}") 
				{
					if(this.token.type === this.tokenEnum.COMMENT) {
						this.nextToken();
						continue;
					}
					this.handleTokenError();
				}

				if(this.token.str !== "}")
				{
					if(this.token.str !== ",") 
					{
						this.validateToken();
						this.nextToken();
						if(this.token.str !== "}") {
							this.handleTokenError();
						}
					}
					else {
						this.nextToken();
					}					
				}
		
				if(expr.exprType !== this.exprEnum.FUNCTION)
				{
					varExpr = new Expression.Var(this.currName, this.parentList);
					varExpr.expr = expr;
					varExpr.analyse();

					this.scope.vars[this.currName] = varExpr;
					this.scope.defBuffer.push(varExpr);
					this.scope.varBuffer.push(varExpr);
				}
			}
			else if(this.token.type === this.tokenEnum.COMMENT) {
				this.nextToken();
				continue;
			}
			else {
				dopple.throw(dopple.Error.UNSUPPORTED_FEATURE, "hashmap");
			}
		}

		this.nextToken();
		this.scope = parentScope;
		this._skipNextToken = true;
		this.parentList = null;

		return objExpr;
	},

	parseFunc: function()
	{
		this.nextToken();

		var name = this.currName;
		var rootName = "";
		if(this.token.type === this.tokenEnum.NAME) 
		{
			rootName = this.token.str;
			if(!name) {
				name = rootName;
			}
			this.nextToken();
		}

		if(!name && !rootName) {
			this.handleUnexpectedToken();
		}
		if(this.token.str !== "(") {
			this.handleUnexpectedToken();
		}

		// Create a new scope.
		this.scope = new dopple.Scope(this.scope);	

		// Parse all variables.
		var newVar;
		var vars = [];
		this.nextToken();
		while(this.token.type === Token.Type.NAME) 
		{
			newVar = new Expression.Var(this.token.str);
			newVar.var = newVar;
			vars.push(newVar);
			this.scope.vars[newVar.name] = newVar;
			
			this.nextToken();
			if(this.token.str !== ",") 
			{
				if(this.token.str === ")") {
					break;
				}

				this.handleUnexpectedToken();
			}

			this.nextToken();
		}

		if(this.token.str !== ")") {
			this.handleUnexpectedToken();
		}		

		this.nextToken();
		if(this.token.str !== "{") {
			dopple.throw(dopple.Error.UNEXPECTED_EOI);
		}		

		// Parse function body:
		var parentList = this.parentList;
		this.parentList = null;
		this.parseBody();
		this.parentList = parentList;
		
		if(this.token.str !== "}") {
			dopple.throw(dopple.Error.UNEXPECTED_EOI);
		}

		var funcExpr = new Expression.Function(name, this.scope, vars, this.parentList);
		funcExpr.rootName = rootName;
		
		this.currName = name;
		var parentScope = this.scope.parent;
		parentScope.vars[this.makeFuncName(this.currName)] = funcExpr;

		this.global.defBuffer.push(funcExpr);
		this.scope = this.scope.parent;

		this.nextToken();
		this._skipNextToken = true;

		return funcExpr;
	},	

	parseFuncCall: function()
	{
		var funcExpr = this.getFunc();

		var i = 0;
		var args = new Array(funcExpr.numParams);
		var param, expr;
		var funcParams = funcExpr.params;
		var numFuncParams = funcParams ? funcParams.length : 0;

		// Check if there are arguments passed:
		this.nextToken();
		if(this.token.str !== ")") 
		{
			// Check if first argument is FORMAT:
			var isFormat = false;
			if(numFuncParams > 0 && funcParams[0].type === this.varEnum.FORMAT) {
				isFormat = true;
			}

			// Parse all variable expressions:	
			for(;; i++)
			{
				// Too many arguments:
				if(i >= numFuncParams && !isFormat) {
					dopple.throw(dopple.Error.TOO_MANY_ARGUMENTS);
				}

				expr = this.parseExpression();
				expr = this.optimizer.do(expr);
				expr.analyse();
				args[i] = expr;

				if(!isFormat) 
				{
					param = funcParams[i];
					if(param.type === 0) {
						param.type = expr.type;
					}
				}
		
				if(this.token.str !== ",") {
					i++;
					break;
				}
				this.nextToken();		
			}
		}

		// Add missing variables with default value:
		for(; i < numFuncParams; i++) {
			args[i] = funcParams[i];				
		}		

		var funcCall = new Expression.FunctionCall(funcExpr, args);
		this.scope.varBuffer.push(funcCall);
	},

	parseReturn: function()
	{
		var expr = null;

		this.nextToken();
		if(this.token.type === this.tokenEnum.VAR ||
		   this.token.type === this.tokenEnum.NUMBER ||
		   this.token.type === this.tokenEnum.STRING)
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

	parseParentList: function()
	{
		this.parentList = [];

		do
		{
			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.handleTokenError();
			}

			var objExpr = this.getExprFromVar(this.scope, this.currName);
			this.parentList.push(objExpr);
			this.currName = this.token.str;

			this.nextToken();
		}
		while(this.token.str === ".");		
	},

	getExprFromVar: function(scope, name) 
	{
		var expr = scope.vars[name];
		if(!expr) {
			dopple.throw(dopple.Error.REFERENCE_ERROR, name);
		}

		return expr;
	},

	getFunc: function() 
	{
		var funcExpr = null;

		if(!this.parentList) {
			funcExpr = this.global.vars[this.currName];
		}
		else
		{
			var numItems = this.parentList.length;
			if(numItems <= 0) {
				funcExpr = this.global.vars[this.currName];
			}
			else
			{
				var name = "";
				for(var i = 0; i < numItems; i++) {
					name += this.parentList[i].name + "$";
				}
				name += this.currName;

				var parentExpr = this.parentList[numItems - 1];
				funcExpr = parentExpr.scope.vars[name];				
			}
		}

		if(!funcExpr) {
			dopple.throw(dopple.Error.REFERENCE_ERROR, name);
		}		

		return funcExpr;
	},

	makeFuncName: function()
	{
		if(!this.parentList) {
			return this.currName;
		}

		var numItems = this.parentList.length;
		if(numItems <= 0) {
			return this.currName;
		}
		
		var name = "";
		for(var i = 0; i < numItems; i++) {
			name += this.parentList[i].name + "$";
		}
		name += this.currName;

		return name;		
	},

	validateToken: function()
	{
		if(this.token.type === this.tokenEnum.EOF) {
			dopple.throw(dopple.Error.UNEXPECTED_EOI);
		}
		else if(this.token.type === this.tokenEnum.NUMBER) {
			dopple.throw(dopple.Error.UNEXPECTED_NUMBER);
		}
		else if(this.token.str === "@") {
			dopple.throw(dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else if(this.token.type !== this.tokenEnum.SYMBOL) {
			dopple.throw(dopple.Error.UNEXPECTED_ID);
		}		
	},

	handleTokenError: function() {
		this.validateToken();
		dopple.throw(dopple.Error.UNEXPECTED_TOKEN, this.token.str);		
	},

	handleUnexpectedToken: function() 
	{
		if(isIllegal(this.token.str)) {
			dopple.throw(dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else {
			dopple.throw(dopple.Error.UNEXPECTED_TOKEN, this.token.str);
		}
	}
};

dopple.Scope = function(parent)
{
	this.parent = parent || null;

	this.vars = {};
	this.defBuffer = [];
	this.varBuffer = [];
};
