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
		if(!this.parseBody(true)) {
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

	parseBody: function(isGlobal)
	{
		if(this.token.str === "}") {
			return true;
		}

		var type, expr;
		do
		{
			type = this.token.type;
			if(type === this.tokenEnum.NAME || 
			   type === this.tokenEnum.VAR) 
			{
				expr = this.parseVar();
				if(!expr) { return null; }
		
				if(expr.expr) {
					this.scope.exprs.push(expr);
				}
			}
			else if(type === this.tokenEnum.IF) 
			{
				if(!this.parseIf()) {
					return false;
				}
			}
			else if(type === this.tokenEnum.FOR) 
			{
				if(!this.parseFor()) {
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
			else if(type === this.tokenEnum.UNARY) 
			{
				expr = this.parseUnary();
				if(!expr) { return false; }

				this.scope.exprs.push(expr);
			}
			else if(type == this.tokenEnum.EOF) 
			{
				if(isGlobal) { return true; }
				this.tokenSymbolError();
				return false;				
			}		

			this.currName = "";
			this.nextToken();
		} while(this.token.str !== "}");

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
			else if(this.token.type === this.tokenEnum.UNARY) {
				return this.parseUnary();
			}

			return this.parseName();
		}
		else if(type === this.tokenEnum.STRING) {
			return this.parseString();
		}		
		else if(type === this.tokenEnum.IF) {
			return this.parseIf();
		}
		else if(type === this.tokenEnum.UNARY) {
			return this.parseUnary();
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
			
		this.tokenError();
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
			expr = this.getVar(this.currName);
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
				this.tokenError();
			}

			initial = true;
		}

		var varName = this.token.str;
		this.currName = varName;
		this.nextToken();

		if(this.token.str === "(") 
		{
			expr = this.parseFuncCall();
			if(!expr) { 
				return null; 
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
				expr = this.parseFuncCall();
				if(!expr) { return null; }
			}
			else {
				throw "(Lexer.parseVar) Unhandled case!";
			}

			this.parentList = null;
		}
		else
		{	
			this.parseVarPost();

			var op = "";

			var expr = null;
			if(this.token.type === this.tokenEnum.ASSIGN || 
			   this.token.type === this.tokenEnum.BINOP_ASSIGN)
			{
				var op = this.token.str;
				this.currName = "";
				this.nextToken();

				this.currExpr = {};
				expr = this.parseExpression();
				this.currExpr = null;

				if(!expr) { return null; }
			}
			else if(this.token.type === this.tokenEnum.UNARY) 
			{
				expr = this.parseUnary();
				if(!expr) { return expr; }

				this.scope.exprs.push(expr);
				return null;
			}
			else 
			{
				if(!initial && this.token.type === this.tokenEnum.NAME) {
					this.tokenError();
				}
				else if(initial && this.token.str !== ";") {
					this.handleUnexpectedToken();
				}
			}

			expr = this._defineVar(varName, expr, op, initial);		
		}

		this.currName = "";

		return expr;
	},	

	parseVarPost: function() {},

	_defineVar: function(name, expr, op, initial)
	{
		// Ignore if it's not a definition and without a body.
		if(!expr && !initial) 
		{
			if(!this.getVar(name)) {
				return null;
			}
			return expr;
		}

		var scopeVarExpr = this.scope.vars[name];

		var varExpr;
		if(scopeVarExpr)
		{
			if(!scopeVarExpr.expr && scopeVarExpr) {
				varExpr = scopeVarExpr;
			}
			else {
				varExpr = new AST.Var(name, this.parentList, this.process.varType);
			}
		}
		else
		{
			varExpr = new AST.Var(name, this.parentList, this.process.varType);

			// No such variable defined.
			if(!initial) {
				dopple.error(this, dopple.Error.REFERENCE_ERROR, this.currName);
				return null;
			}

			varExpr.isDef = true;
			scopeVarExpr = varExpr;

			// If function pointer:
			if(expr && expr.exprType === this.exprEnum.FUNCTION) {
				this.scope.vars[name] = expr;
			}	
			else {
				this.scope.vars[name] = varExpr;
			}		
		}

		varExpr.var = scopeVarExpr;
		varExpr.op = op;
		
		if(expr) {
			varExpr.expr = expr;
		}
		
		if(this.token.str !== ";") {
			this._skipNextToken = true;
		}	

		return varExpr;		
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
			this.tokenSymbolError();
			return false;
		}

		this.nextToken();
		var expr = this.parseExpression();
		if(!expr) {
			this.tokenSymbolError();
			return false;
		}

		if(this.token.str !== ")") {
			this.tokenSymbolError();
			return false;
		}

		this.nextToken();
		if(this.token.str !== "{") {
			this.tokenSymbolError();
			return false;
		}

		var virtualScope = this.scope.createVirtual();
		this.scope = virtualScope;

		this.nextToken();
		if(this.token.str !== "}") 
		{
			if(!this.parseBody(false)) {
				return false;
			}
		}

		this.scope = this.scope.parent;

		if(this.token.str !== "}") {
			this.tokenSymbolError();
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
					this.tokenError();
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
					this.tokenError();
				}

				if(this.token.str !== "}")
				{
					if(this.token.str !== ",") 
					{
						this.tokenSymbolError();
						this.nextToken();
						if(this.token.str !== "}") {
							this.tokenError();
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
		if(!this.parseBody(false)) {
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

	parseUnary: function() 
	{
		var expr = new AST.Unary();
		expr.op = this.token.str;

		this.nextToken();
		if(!this.currName) 
		{
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
				return null;
			}

			this.currName = this.token.str;
			this.nextToken();
			expr.pre = true;
		}		

		expr.varExpr = this.getVar(this.currName);
		if(!expr.varExpr) { return null; }

		this.currName = "";

		return expr;
	},

	parseFor: function()
	{
		var forExpr = new AST.For();

		this.nextToken();
		if(this.token.str !== "(") {
			this.tokenSymbolError();
			return null;
		}

		var expr;

		this.nextToken();
		if(this.token.str !== ";")
		{
			expr = this.parseVar();
			if(!expr) { return null; }

			if(this.token.str !== ";") {
				this.tokenSymbolError();
				return null;				
			}

			forExpr.initExpr = expr;
		}
		
		this.nextToken();
		if(this.token.str !== ";")
		{
			var expr = this.parseExpression();
			if(!expr) { return null; }

			if(this.token.str !== ";") {
				this.tokenSymbolError();
				return null;				
			}
		}

		this.nextToken();
		if(this.token.str !== ")") {
			this.tokenSymbolError();
			return null;				
		}

		this.nextToken();
		if(this.token.str !== "{") {
			this.tokenSymbolError();
			return null;				
		}		

		this.nextToken();
		if(this.token.str !== "}") {
			this.tokenSymbolError();
			return null;				
		}		

		this.scope.exprs.push(forExpr);

		return forExpr;
	},

	parseParentList: function()
	{
		this.parentList = [];

		do
		{
			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
			}

			var objExpr = this.getVar(this.currName);
			if(!objExpr) { return false; }

			this.parentList.push(objExpr);
			this.currName = this.token.str;

			this.nextToken();
		}
		while(this.token.str === ".");	

		return true;	
	},

	getVar: function(name) 
	{
		var expr;
		var scope = this.scope;
		for(;;)
		{
			expr = scope.vars[name];
			if(expr) { break; } // Success

			if(!expr) 
			{
				if(scope === this.global) {
					dopple.error(this, dopple.Error.REFERENCE_ERROR, name);
					return null;					
				}

				scope = scope.parent;
			}
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
				if(!this.resolveVar(expr)) {
					return false;
				}				
			}
			else if(type === this.exprEnum.IF) 
			{
				if(!this.resolveIf(expr)) {
					return false;
				}
			}
			else if(type === this.exprEnum.FOR)
			{
				if(!this.resolveFor(expr)) {
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

	resolveVar: function(expr)
	{
		expr.expr = this.optimizer.do(expr.expr);
		if(!expr.analyse(this)) {
			return false;
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

	resolveFor: function(expr)
	{
		if(expr.initExpr) {
			if(!this.resolveVar(expr.initExpr)) { return false; }
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

		// Error: If type is defined without return expression:
		if(expr.type !== 0 && numRetExprs === 0) {
			console.error("ReturnError: Function \'" + expr.name + "\' requires at least one return expression");
			return false;		
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
			dopple.error(this, dopple.Error.REFERENCE_ERROR, funcExpr.name);
			return false;
		}

		var i;
		var args = expr.args;
		var params = funcExpr.params;
		var numArgs = args.length;
		var numParams = params.length;

		// If function call has too many arguments, check first if any of argument is FORMAT:
		var format;
		if(numArgs > numParams) 
		{
			format = false; 

			for(i = 0; i < numParams; i++) 
			{
				if(params[i].type === this.varEnum.FORMAT) {
					format = true;
					break;
				}
			}

			if(!format) {
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

			if(i < numParams && params[i].type === 0) {
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

	tokenSymbolError: function()
	{
		if(this.token.type === this.tokenEnum.EOF) {
			dopple.error(this, dopple.Error.UNEXPECTED_EOI);
		}
		else if(this.token.type === this.tokenEnum.NUMBER) {
			dopple.error(this, dopple.Error.UNEXPECTED_NUMBER);
		}
		else if(this.isTokenIllegal()) {
			dopple.error(this, dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else if(this.token.type !== this.tokenEnum.SYMBOL) {
			dopple.error(this, dopple.Error.UNEXPECTED_ID);
		}	
	},

	tokenError: function() {
		this.tokenSymbolError();
		dopple.error(this, dopple.Error.UNEXPECTED_TOKEN, this.token.str);		
	},

	handleUnexpectedToken: function() 
	{
		if(isIllegal(this.token.str)) {
			dopple.error(this, dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else {
			dopple.error(this, dopple.Error.UNEXPECTED_TOKEN, this.token.str);
		}
	},

	isTokenIllegal: function()
	{
		var str = this.token.str;
		if(str === "@" || str === "#") {
			return true;
		}

		return false;
	},

	//
	tokenizer: null,
	token: null,
	peekedToken: null,
	prevToken: null,

	optimizer: null,
	extern: null,

	error: null,

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
	defOutput: "",
	isVirtual: false
};
