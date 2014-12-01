"use strict";

var Lexer = {};

Lexer.Basic = dopple.Class.extend
({
	_init: function() 
	{
		this.global = new dopple.Scope();
		this.scope = this.global;
		this.funcs = [];
		
		this.tokenizer = new dopple.Tokenizer();
		this.optimizer = new dopple.Optimizer(this);
		this.extern = new dopple.Extern(this);
		
		this.process.varType = 0;
	},

	read: function(buffer) 
	{
		this.tokenizer.setBuffer(buffer);
		this.nextToken();
		if(!this.parseBody()) {
			return false;
		}

		return this.resolve(this.global);
	},

	nextToken: function() 
	{
		if(!this._skipNextToken) {
			this.token = this.tokenizer.nextToken();
		}
		else {
			this._skipNextToken = false;
		}
	},

	peekToken: function() {
		this.peekedToken = this.tokenizer.peek();
	},

	eatToken: function() {
		this.tokenizer.eat();
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
			type = this.token.type;
			if(type === this.tokenEnum.NAME || 
			   type === this.tokenEnum.VAR) 
			{
				if(!this.parseVar()) {
					return false;
				}
			}
			else if(type === this.tokenEnum.IF) 
			{
				if(!this.parseIf()) {
					return false;
				}
			}
			else if(type === this.tokenEnum.FUNCTION) 
			{
				if(!this.parseFunc()) {
					return false;
				}
			}
			else if(type === this.tokenEnum.RETURN) {
				this.parseReturn();
			}			

			this.currName = "";
			this.nextToken();
		} while(this.token.type !== this.tokenEnum.EOF && this.token.str !== "}");

		return true;
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

			lhs = new AST.Binary(binop, lhs, rhs);
		}

		return lhs;
	},

	parsePrimary: function()
	{
		var type = this.token.type;

		if(type === this.tokenEnum.NUMBER) {
			return this.parseNumber();
		}
		else if(type === this.tokenEnum.NAME) 
		{	
			this.currName = this.token.str;
			this.nextToken();

			// Check if it's a function call:
			if(this.token.str === "(") {
				return this.parseFuncCall();
			}

			return this.parseName();
		}
		else if(type === this.tokenEnum.VAR) {
			return this.parseVar();
		}
		else if(type === this.tokenEnum.STRING) {
			return this.parseString();
		}		
		else if(type === this.tokenEnum.IF) {
			return this.parseIf();
		}
		else if(type === this.tokenEnum.BOOL) {
			return this.parseBool();
		}
		else if(type === this.tokenEnum.RETURN) {
			return this.parseReturn();
		}
		else if(type === this.tokenEnum.FUNCTION) {
			return this.parseFunc();
		}
		else if(this.token.str === "(") {
			return this.parseExprParentheses();
		}
		else if(this.token.str === "{") {
			return this.parseObject();
		}
			
		this.handleTokenError();
	},

	parseNumber: function() 
	{
		var expr = new AST.Number(this.token.value);
		this.nextToken();
		return expr;
	},

	parseBool: function()
	{
		var expr = new AST.Bool(this.token.value);
		this.nextToken();
		return expr;
	},

	parseName: function()
	{
		// If there is no such variable, it should be a function:
		var expr = this.scope.vars[this.currName];
		if(!expr) {
			expr = this.getFunc(this.currName);
			expr.numUses++;
		}

		//var chain = null;
		// // Check if is accessing to objects:
		// this.nextToken();
		// if(this.token.str === ".") 
		// {
		// 	chain = [];

		// 	this.nextToken();
		// 	do
		// 	{
		// 		if(this.token.type !== this.tokenEnum.NAME) {
		// 			this.handleTokenError();
		// 		}

		// 		parentList.push(this.currName);
		// 		this.currName = this.token.str;

		// 		this.nextToken();		
		// 	} while(this.token.str === ".");

		// 	expr.chain = parentList;
		// }

		return expr;
	},

	parseString: function()
	{
		var expr = new AST.String(this.token.str);
		this.nextToken();
		return expr;
	},	

	parseExprParentheses: function()
	{
		this.nextToken();

		var expr = this.parseExpression();
		if(!expr) {
			return null;
		}

		if(this.token.str !== ")") {
			console.error(dopple.Error.UNEXPECTED_EOI);
			return null;
		}
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

		var varName = this.token.str;
		this.currName = varName;
		this.nextToken();

		if(this.token.str === "(") 
		{
			if(!this.parseFuncCall()) {
				return false;
			}
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
			else if(this.token.str === "(") 
			{
				if(!this.parseFuncCall()) {
					return false;
				}
			}
			else {
				throw "Lexer::parseVar: Unhandled case!";
			}

			this.parentList = null;
		}
		else
		{	
			this.parseVarPost();

			if(this.token.str === "=")
			{
				this.nextToken();

				this.currExpr = {};
				var expr = this.parseExpression();
				this.currExpr = null;

				if(!expr) { return false; }

				if(!this._defineVar(varName, expr, initial)) {
					return false;
				}	
			}
			else 
			{
				if(!initial && this.token.type === this.tokenEnum.NAME) {
					this.handleTokenError();
				}
				else if(initial && this.token.str !== ";") {
					this.handleUnexpectedToken();
				}

				if(!this._defineVar(varName, null, initial)) {
					return false;
				}
			}
		}

		this.currName = "";

		return true;
	},	

	parseVarPost: function() {},

	_defineVar: function(name, expr, initial)
	{
		// Ignore if it's not a definition and without a body.
		if(!expr && !initial) {
			this.getExprFromVar(this.scope, name);
			return true;
		}

		var varExpr = new AST.Var(name, this.parentList, this.process.varType);
		
		var scopeVarExpr = this.scope.vars[name];
		if(scopeVarExpr === void(0)) 
		{
			// No such variable defined.
			if(!initial) {
				dopple.error(dopple.Error.REFERENCE_ERROR, this.currName);
				return false;
			}

			varExpr.isDef = true;
			scopeVarExpr = varExpr;

			// If function pointer:
			if(expr && expr.exprType === this.exprEnum.FUNCTION) {
				this.scope.vars[name] = expr;
				this.scope.exprs.push(varExpr);
			}	
			else 
			{
				this.scope.vars[name] = varExpr;
				if(expr) { this.scope.exprs.push(varExpr); }
			}		
		}

		varExpr.var = scopeVarExpr;
		varExpr.expr = expr;
		
		if(this.token.str !== ";") {
			this._skipNextToken = true;
		}	

		return true;		
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
				memberExpr = new AST.Var(this.currName, parentList);
				memberExpr.var = memberExpr;

				var varExpr = new AST.Var(this.currName, parentList);
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
			var varExpr = new AST.Var(this.currName, parentList);
			varExpr.expr = this.parseExpression();
			varExpr.expr = this.optimizer.do(varExpr.expr);
			varExpr.var = memberExpr;
			varExpr.analyse();	

			this.scope.vars[this.currName] = varExpr;
			this.scope.varBuffer.push(varExpr);				
		}	

		this.scope = this.scope.parent;
	},

	parseIf: function()
	{
		this.nextToken();
		if(this.token.str !== "(") {
			this.validateToken();
			return false;
		}

		this.nextToken();
		var expr = this.parseExpression();
		if(!expr) {
			this.validateToken();
			return false;
		}

		if(this.token.str !== ")") {
			this.validateToken();
			return false;
		}

		this.nextToken();
		if(this.token.str !== "{") {
			this.validateToken();
			return false;
		}

		var virtualScope = this.scope.createVirtual();
		this.scope = virtualScope;

		this.nextToken();
		if(this.token.str !== "}") 
		{
			if(!this.parseBody()) {
				return false;
			}
		}

		this.scope = this.scope.parent;

		if(this.token.str !== "}") {
			this.validateToken();
			return false;
		}		

		var ifExpr = new AST.If();
		ifExpr.addBranch(expr, virtualScope);
		this.scope.exprs.push(ifExpr);

		return true;
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

		var objExpr = new AST.Class(name, this.scope);
		parentScope.vars[name] = objExpr;
		parentScope.defBuffer.push(objExpr);
		this.parentList = [ objExpr ];

		// Constructor:
		var initFunc = new AST.Function("__init", this.scope, null, this.parentList);
		this.scope.vars["__init"] = initFunc;
		parentScope.defBuffer.push(initFunc);

		var initFuncCall = new AST.FunctionCall(initFunc);
		parentScope.varBuffer.push(initFuncCall);

		// Parse object members:
		var varName, varExpr, expr;
		this.nextToken();
		while(this.token.str !== "}") 
		{
			if(this.token.type === this.tokenEnum.NAME ||
			   this.token.type === this.tokenEnum.NAME) 
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
					varExpr = new AST.Var(this.currName, this.parentList);
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

		var funcExpr = this.getFunc(name);
		funcExpr.parentList = this.parentList;
		funcExpr.rootName = rootName;
		funcExpr.empty = false;
		funcExpr.scope = new dopple.Scope(this.scope);	
		this.scope = funcExpr.scope;
		
		var vars = this.parseFuncParams();
		if(!vars) {
			return null;
		}	
		funcExpr.params = vars;

		this.nextToken();
		if(!this.parseFuncPost(funcExpr)) {
			return null;
		}

		if(this.token.str !== "{") {
			dopple.throw(dopple.Error.UNEXPECTED_EOI);
		}		

		var parentList = this.parentList;
		this.parentList = null;		

		this.nextToken();
		if(!this.parseBody()) {
			return null;
		}

		this.parentList = parentList;
		
		if(this.token.str !== "}") {
			dopple.throw(dopple.Error.UNEXPECTED_EOI);
		}
		
		this.scope = this.scope.parent;

		this.nextToken();
		this._skipNextToken = true;

		return funcExpr;
	},	

	parseFuncParams: function()
	{
		var newVar;
		var params = [];
		this.nextToken();
		while(this.token.type === this.tokenEnum.NAME) 
		{
			newVar = new AST.Var(this.token.str);
			newVar.var = newVar;
			params.push(newVar);
			this.scope.vars[newVar.value] = newVar;
			
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

		return params;		
	},

	parseFuncPre: function(funcExpr) { return true; },

	parseFuncPost: function(funcExpr) { return true; },

	parseFuncCall: function()
	{
		var i = 0;
		var funcExpr = this.getFunc(this.currName);
		var args = new Array(funcExpr.numParams);
		var param, expr;
		var funcParams = funcExpr.params;
		var numFuncParams = funcParams ? funcParams.length : 0;

		// Check if there are arguments passed:
		this.nextToken();
		if(this.token.str !== ")") 
		{
			// Parse all arguments:	
			for(;; i++)
			{
				expr = this.parseExpression();
				if(!expr) { return null; }

				args[i] = expr;
		
				if(this.token.str !== ",") {
					i++;
					break;
				}
				this.nextToken();		
			}
		}

		var funcCall = new AST.FunctionCall(funcExpr, args);
		funcExpr.numUses++;

		if(!this.currExpr) {
			this.scope.exprs.push(funcCall);
		}

		this.nextToken();

		return funcCall;
	},

	parseReturn: function()
	{
		var varExpr = null;

		this.nextToken();
		if(this.token.type > 2 && this.token.type < 9) 
		{
			varExpr = new AST.Var("");

			this.currExpr = {};
			varExpr.expr = this.parseExpression();
			this.currExpr = null;

			varExpr.var = varExpr.expr;
		}

		var returnExpr = new AST.Return(varExpr);
		this.scope.exprs.push(returnExpr);
		this.scope.returns.push(returnExpr);

		return true;
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

	getFunc: function(name) 
	{
		var funcExpr = null;

		if(!this.parentList) {
			funcExpr = this.global.vars[name];
		}
		else
		{
			var numItems = this.parentList.length;
			if(numItems <= 0) {
				funcExpr = this.global.vars[name];
			}
			else
			{
				var fullName = "";
				for(var i = 0; i < numItems; i++) {
					fullName += this.parentList[i].name + "$";
				}
				fullName += name;

				var parentExpr = this.parentList[numItems - 1];
				funcExpr = parentExpr.scope.vars[fullName];				
			}
		}

		if(!funcExpr) 
		{
			funcExpr = new AST.Function(name, null, null, this.parentList);
			funcExpr.empty = true;
			funcExpr.rootName = name;

			this.scope.vars[this.makeFuncName(name)] = funcExpr;
			this.funcs.push(funcExpr);			
		}		

		return funcExpr;
	},

	makeFuncName: function(name)
	{
		if(!this.parentList) {
			return name;
		}

		var numItems = this.parentList.length;
		if(numItems <= 0) {
			return name;
		}
		
		var parentName = "";
		for(var i = 0; i < numItems; i++) {
			parentName += this.parentList[i].name + "$";
		}
		parentName += name;

		return parentName;		
	},

	resolve: function(scope)
	{
		var expr, type, i;
		var exprs = scope.exprs;
		var numExpr = exprs.length;
		for(i = 0; i < numExpr; i++)
		{
			expr = exprs[i];
			type = expr.exprType;

			if(type === this.exprEnum.VAR) 
			{
				expr.expr = this.optimizer.do(expr.expr);
				if(!expr.analyse(this)) {
					return false;
				}
			}
			else if(type === this.exprEnum.IF) 
			{
				if(!this.resolveIf(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.FUNCTION_CALL) 
			{
				if(!this.resolveFuncCall(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.RETURN) 
			{
				expr.expr.expr = this.optimizer.do(expr.expr.expr);
				if(!expr.expr.analyse(this)) {
					return false;
				}				
			}
		}

		return true;
	},

	resolveIf: function(expr)
	{
		var branches = expr.branches;
		var numBranches = branches.length;
		for(var i = 0; i < numBranches; i++) 
		{
			if(!this.resolve(branches[i].scope)) {
				return false;
			}
		}

		return true;
	},

	resolveFunc: function(expr) 
	{
		if(expr.resolved) { return true; }

		var retExpr, i;
		var retExprs = expr.scope.returns;
		var numRetExprs = retExprs.length;

		if(expr.type === 0 && expr.resolving) 
		{
			// Try first to guess function type if type is unknown:
			for(i = 0; i < numRetExprs; i++)
			{			
				retExpr = retExprs[i].expr;
				if(!retExpr) { continue; }

				//retExpr.expr = this.optimizer.do(retExpr.expr);
				retExpr.analyse(this);	

				if(expr.type === 0) {
					expr.type = retExpr.type;
					break;
				}				
			}

			return true;
		}

		expr.resolving = true;

		if(expr.type === 0 && !numRetExprs) 
		{
			// Error: If type is defined without return expression:
			if(numRetExprs === 0) {
				console.error("ReturnError: Function \'" + expr.name + "\' requires at least one return expression");
				return false;
			}			
		}

		if(!this.resolve(expr.scope)) { return false; }

		// Re-check function type:
		for(i = 0; i < numRetExprs; i++)
		{
			retExpr = retExprs[i].expr;
			if(!retExpr) { continue; }

			if(expr.type === 0) {
				expr.type = retExpr.type;
			}
			else if(expr.type !== retExpr.type) 
			{
				console.error("ReturnError: Function \'" + expr.name + 
					"\' different return expressions dont have matching return types: is " + 
					expr.strType() + " but expected " + retExpr.strType());
				return false;
			}
		}

		expr.resolved = true;
		expr.resolving = false;

		return true;
	},

	resolveFuncCall: function(expr) 
	{
		if(expr.resolved || expr.resolving) { return true; }
		expr.resolving = true;

		var funcExpr = expr.func;
		if(funcExpr.empty) {
			dopple.error(dopple.Error.REFERENCE_ERROR, funcExpr.name);
			return false;
		}

		var i;
		var args = expr.args;
		var params = funcExpr.params;
		var numArgs = args.length;
		var numParams = params.length;

		// If function call has too many arguments, check first if any of argument is FORMAT:
		if(numArgs > numParams) 
		{
			var error = true; 

			for(i = 0; i < numArgs; i++) 
			{
				if(i >= numParams && args[i].type !== this.varEnum.FORMAT) { break; } 
				if(args[i].type === this.varEnum.FORMAT) 
				{
					if(params[i].type !== this.varEnum.FORMAT) { break; }

					error = false;
					break;
				}
			}

			if(error) {
				console.error("TOO_MANY_ARGS: Function call \"" + funcExpr.name + "\" has " 
					+ numArgs + " args, expecting maximum of " + numParams + " args");
				return false;				
			}
		}	

		// Analyse all argument expressions:
		var argExpr;
		for(i = 0; i < numArgs; i++)
		{
			argExpr = this.optimizer.do(args[i]);
			if(!argExpr.analyse()) { 
				return false; 
			}
			args[i] = argExpr;

			if(params[i].type === 0) {
				params[i].type = argExpr.type;
			}
		}	

		if(!this.resolveFunc(funcExpr)) {
			return false;
		}

		expr.resolved = true;
		expr.resolving = false;

		return true;
	},

	validateToken: function()
	{
		if(this.token.type === this.tokenEnum.EOF) {
			dopple.error(dopple.Error.UNEXPECTED_EOI);
		}
		else if(this.token.type === this.tokenEnum.NUMBER) {
			dopple.error(dopple.Error.UNEXPECTED_NUMBER);
		}
		else if(this.token.str === "@") {
			dopple.error(dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else if(this.token.type !== this.tokenEnum.SYMBOL) {
			dopple.error(dopple.Error.UNEXPECTED_ID);
		}	
	},

	handleTokenError: function() {
		this.validateToken();
		dopple.error(dopple.Error.UNEXPECTED_TOKEN, this.token.str);		
	},

	handleUnexpectedToken: function() 
	{
		if(isIllegal(this.token.str)) {
			dopple.throw(dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else {
			dopple.throw(dopple.Error.UNEXPECTED_TOKEN, this.token.str);
		}
	},

	//
	tokenizer: null,
	token: null,
	peekedToken: null,
	prevToken: null,

	optimizer: null,
	extern: null,

	global: null, 
	scope: null,
	funcs: null,

	varTypes: {},
	defTypes: {},
	process: {},
	numVarTypes: 0,	

	precedence: {
		"=": 2,
		"<": 1000,
		">": 1000,
		"==": 1000,
		"===": 1000,
		"!=": 1000,
		"!==": 1000,
		"<=": 1000,
		">=": 1000,
		"+": 2000,
		"-": 2000,
		"*": 4000,
		"/": 4000
	},

	genID: 0,
	currName: "",
	currVar: null,
	currExpr: null,
	parentList: null,
	
	_skipNextToken: false,

	tokenEnum: dopple.TokenEnum,
	varEnum: dopple.VarEnum,
	exprEnum: dopple.ExprEnum
});

dopple.Scope = function(parent)
{
	this.parent = parent || null;
	this.vars = {};
	this.exprs = [];
	this.returns = [];
};

dopple.Scope.prototype = 
{
	createVirtual: function() {
		var scope = new dopple.Scope();
		scope.parent = this;
		scope.vars = this.vars;
		scope.returns = this.returns;
		scope.isVirtual = true;
		return scope;
	},

	//
	isVirtual: false
};
