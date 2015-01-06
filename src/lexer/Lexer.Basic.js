"use strict";

var Lexer = {};

Lexer.Basic = dopple.Class.extend
({
	_init: function() 
	{
		dopple.lexer = this;
		
		this.settings = dopple.settings;
		this.global = new dopple.Scope();
		this.scope = this.global;
		this.funcs = [];
		
		this.tokenizer = new dopple.Tokenizer();
		this.extern = new dopple.Extern(this);
		
		this.process.varType = 0;
	},

	read: function(buffer) 
	{
		this.loadExterns();
		
		this.tokenizer.setBuffer(buffer);
		this.nextToken();
		if(!this.parseBody(true)) {
			return false;
		}

		return dopple.resolver.resolve(this.global);
	},

	loadExterns: function()
	{
		var string = this.extern.obj("String");
		string.mutator("length", this.varEnum.NUMBER, this.varEnum.NUMBER);
	},

	nextToken: function() {
		this.token = this.tokenizer.nextToken(null);
		this.line = this.token.line;
	},

	peekToken: function() {
		this.peekedToken = this.tokenizer.peek();
	},

	eatToken: function() {
		this.tokenizer.eat();
	},

	getTokenPrecendence: function()
	{
		var type = this.token.type;
		if(type !== this.tokenEnum.BINOP &&
		   type !== this.tokenEnum.ASSIGN && 
		   type !== this.tokenEnum.BINOP_ASSIGN) 
		{
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

		var type, str, expr, line;
		do
		{
			line = this.line;
			type = this.token.type;
			str = this.token.str;

			if(type === this.tokenEnum.NAME || str === "var") 
			{
				var forceInitial = false;
				for(;;)
				{
					expr = this.parseVar(forceInitial);
					if(this.isError) { return null; }

					if(expr)
					{
						if(expr instanceof AST.Var) 
						{
							if(expr.expr) {
								this.scope.exprs.push(expr);
							}
						}
						else {
							this.scope.exprs.push(expr);
						}
					}

					if(this.token.str !== ",") { break; }

					forceInitial = true;
					this.nextToken();
				}
			}
			else if(type === this.tokenEnum.STRING)
			{
				if(!this.parseString()) {
					return false;
				}
			}
			else if(str === "if") 
			{
				if(!this.parseIf()) {
					return false;
				}
			}
			else if(str === "for") 
			{
				if(!this.parseFor()) {
					return false;
				}
			}			
			else if(str === "function") 
			{
				if(!this.parseFunc()) {
					return false;
				}
			}
			else if(str === "return") {
				this.parseReturn();
			}	
			else if(type === this.tokenEnum.UNARY) 
			{
				expr = this.parseUnary();
				if(!expr) { return false; }

				this.scope.exprs.push(expr);
			}
			else if(type === this.tokenEnum.NUMBER) 
			{
				if(!this.parseExpr(null)) {
					return false;
				}
			}			
			else if(type === this.tokenEnum.COMMENT) {
				this.nextToken();
			}
			
			// Post process:
			if(this.token.type === this.tokenEnum.EOF) 
			{
				if(isGlobal) { return true; }
				this.tokenSymbolError();
				return false;				
			}		

			if(line === this.line && this.token.str !== ";") { 
				this.tokenSymbolError();
				return false;
			}

			while(this.token.str === ";") {
				this.nextToken();
			}

			this.currName = "";
		} while(this.token.str !== "}");

		this.nextToken();
		return true;
	},

	parseExpr: function(parentList)
	{
		var lhs = this.parsePrimary(parentList);
		if(!lhs) {
			return null;
		}

		return this.parseBinOpRHS(0, lhs, parentList);
	},

	parseBinOpRHS: function(exprPrecedence, lhs, parentList)
	{
		for(;;)
		{
			var precendence = this.getTokenPrecendence();
			if(precendence < exprPrecedence) {
				return lhs;
			}

			var binop = this.token.str;
			this.nextToken();

			var rhs = this.parsePrimary(parentList);
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

	parsePrimary: function(parentList)
	{
		var expr;
		var type = this.token.type;
		var str = this.token.str;

		if(type === this.tokenEnum.NUMBER) {
			expr = this.parseNumber();
		}
		else if(type === this.tokenEnum.NAME) {	
			expr = this.parseName();
		}
		else if(type === this.tokenEnum.STRING) {
			expr = this.parseString();
		}		
		else if(str === "new") {
			expr = this.parseNew();
		}
		else if(str === "if") {
			expr = this.parseIf();
		}
		else if(type === this.tokenEnum.UNARY) {
			expr = this.parseUnary();
		}
		else if(type === this.tokenEnum.BOOL) {
			expr = this.parseBool();
		}
		else if(str === "return") {
			expr = this.parseReturn();
		}
		else if(str === "function") {
			expr = this.parseFunc(parentList);
		}
		else if(this.token.str === "(") {
			expr = this.parseExprParentheses();
		}
		else if(this.token.str === "{") {
			expr = this.parseObj();
		}
		else {
			this.tokenError();
			return null;
		}	

		this.currName = "";	

		return expr;
	},

	parseNumber: function() {
		var expr = new AST.Number(this.token.value);
		this.nextToken();
		return expr;
	},

	parseBool: function() {
		var expr = new AST.Bool(this.token.value);
		this.nextToken();
		return expr;
	},

	parseName: function()
	{
		this.currName = this.token.str;
		this.nextToken();

		if(this.token.str === ".")
		{
			var parentList = this.parseParentList();
			if(!parentList) { return null; }

			var expr = this.getVar(this.currName, parentList);
			if(!expr) { return null; }
		}
		else
		{
			var expr = this.getVar(this.currName);
			if(!expr) { return null; }

			if(this.token.type === this.tokenEnum.UNARY) {
				expr = this.parseUnary();
			}				
		}

		// Check if it's a function call:
		if(this.token.str === "(") {
			expr = this.parseFuncCall(parentList);
		}

		return expr;
	},

	parseString: function()
	{
		var strExpr = new AST.String(this.token.str);
		
		// Check if is object function call:
		this.nextToken();
		if(this.token.str === ".") 
		{
			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenSymbolError();
				return null;
			}
			
			var clsExpr = this.global.vars.String;
			var clsVarExpr = clsExpr.scope.vars[this.token.str];
			if(!clsVarExpr) {
				this.refError(this.token.str);
				return null;				
			}

			this.nextToken();
			var expr = null;
			var type = this.token.type;
			if(type === this.tokenEnum.ASSIGN || type === this.tokenEnum.BINOP_ASSIGN) 
			{
				expr = this.parseExpr(null);
				if(!expr) { return null; }
			}

			if(clsVarExpr.exprType === this.exprEnum.MUTATOR) 
			{
				// Setter
				if(expr) {

				}
				// Getter
				else {

				}
			}
		}

		return strExpr;
	},	

	parseExprParentheses: function()
	{
		this.nextToken();

		var expr = this.parseExpr(null);
		if(!expr) {
			return null;
		}

		if(this.token.str !== ")") {
			this.tokenSymbolError();
			return null;
		}
		this.nextToken();
		
		return expr;
	},	

	parseNew: function()
	{
		this.nextToken();
		if(this.token.type !== this.tokenEnum.NAME) {
			this.tokenError();
			return null;
		}

		var funcExpr = this.getVar(this.token.str);
		if(!funcExpr) { return null; }

		var allocExpr = new AST.Alloc(funcExpr);
		console.log(this.token);

		return allocExpr;
	},

	parseVar: function(forceInitial)
	{
		var initial = forceInitial || false;
		if(this.token.str === "var")
		{
			this.nextToken();	
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
			}

			initial = true;
		}

		var varName = this.token.str;
		this.currName = varName;
		this.tmpName = varName;
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
				this.tokenError();
				return null;
			}

			var parentList = this.parseParentList();
			if(!parentList) { return null; }

			if(this.token.str === "=") {
				this._defineObjVar(parentList);
			}
			else if(this.token.str === "(") 
			{
				expr = this.parseFuncCall(parentList);
				if(!expr) { return null; }
			}
		}
		else
		{	
			if(this.token.type === this.tokenEnum.BINOP) {
				this.parseUntilExprEnd();
				return null;
			}

			this.parseVarPost();

			var op = "";

			var expr = null;
			if(this.token.type === this.tokenEnum.ASSIGN || 
			   this.token.type === this.tokenEnum.BINOP_ASSIGN)
			{
				var op = this.token.str;
				this.currName = "";
				this.nextToken();

				this.currExpr = true;
				expr = this.parseExpr(null);
				this.currExpr = false;

				if(!expr) { return null; }

				if(expr.exprType === this.exprEnum.FUNCTION || 
				   expr.exprType === this.exprEnum.CLASS) 
				{
					return null;
				} 
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
			}

			expr = this._defineVar(varName, expr, op, initial);		
		}

		this.currName = "";
		this.tmpName = "";

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
			if(!scopeVarExpr.expr) {
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
				this.refError(name);
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

		return varExpr;		
	},

	_defineObjVar: function(parentList)
	{
		var objExpr = parentList[parentList.length - 1];
		this.scope = objExpr.scope;

		this.tmpName = this.currName;
		var varName = this.currName;
		var memberExpr = this.scope.vars[varName];

		this.nextToken();	

		// If object don't have such variable - add as a definiton:
		if(!memberExpr) 
		{
			var expr = this.parseExpr(parentList);

			if(expr.exprType === this.exprEnum.FUNCTION) {
				memberExpr = expr;
			}
			else
			{
				memberExpr = new AST.Var(varName, parentList);
				memberExpr.expr = expr;
				memberExpr.var = memberExpr;

				this.scope.vars[varName] = memberExpr;		
			}	
		}
		else
		{	
			var varExpr = new AST.Var(varName, parentList);
			varExpr.expr = this.parseExpr(null);
			varExpr.var = memberExpr;	
		}	

		this.scope = this.scope.parent;
	},

	parseIf: function()
	{
		var ifExpr = new AST.If();
		var expr, type;

		for(;;)
		{
			if(this.token.str === "if" || this.token.str === "else if")
			{
				type = this.token.str;

				this.nextToken();
				if(this.token.str !== "(") {
					this.tokenSymbolError();
					return false;
				}

				this.nextToken();
				expr = this.parseExpr(null);
				if(!expr) {
					this.tokenSymbolError();
					return false;
				}

				if(this.token.str !== ")") {
					this.tokenSymbolError();
					return false;
				}
			}
			else {
				type = this.token.str;
				expr = null;	
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
			else {
				this.nextToken();
			}

			this.scope = this.scope.parent;

			ifExpr.addBranch(type, expr, virtualScope);

			if(this.token.str !== "else if" && this.token.str !== "else") {
				break;
			}
		}
		
		this.scope.exprs.push(ifExpr);

		return true;
	},

	parseObj: function()
	{
		var name = "";
		if(this.scope === this.global) {
			name = this.tmpName;
		}
		else {
			name = "__Sanonym" + this.genID++ + "__";
		}

		if(this.scope.vars[name]) {
			dopple.error(this.line, dopple.Error.REDEFINITION, name);
			return null;
		}

		this.scope = new dopple.Scope(this.global);

		var objExpr = new AST.Class(name, this.scope);
		this.global.vars[name] = objExpr;
		if(!this.global.objs) {
			this.global.objs = [];
		}
		this.global.objs.push(objExpr);

		var parentList = [ objExpr ];

		// Constructor:
		var constrFunc = new AST.Function("constructor", this.scope, null, parentList);
		constrFunc.obj = objExpr;
		this.scope.vars["constructor"] = constrFunc;
		objExpr.constrFunc = constrFunc;

		var constrFuncCall = new AST.FunctionCall(constrFunc);
		this.global.exprs.push(constrFuncCall);

		// Parse object members:
		var varName, varExpr, expr;
		this.nextToken();
		while(this.token.str !== "}") 
		{
			if(this.token.type === this.tokenEnum.NAME) 
			{
				this.tmpName = this.token.str;

				this.nextToken();
				if(this.token.str !== ":") {
					this.tokenError();
					return null;
				}

				this.nextToken();
				expr = this.parseExpr(parentList);
				if(!expr) { return null; }

				if(this.token.type === this.tokenEnum.NEWLINE) {
					this.nextToken();
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
		
				if(expr.exprType === this.exprEnum.FUNCTION) {
					this.scope.vars[expr.name] = expr;
				}
				else if(expr.exprType === this.exprEnum.CLASS) {

				}
				else
				{
					varExpr = new AST.Var(this.tmpName, parentList);
					varExpr.expr = expr;
					varExpr.var = varExpr;
					this.scope.vars[this.tmpName] = varExpr;
				}
			}
			else if(this.token.type === this.tokenEnum.COMMENT) {
				this.nextToken();
				continue;
			}

			this.tmpName = "";
		}

		this.nextToken();
		this.scope = this.global;
		this.parentList = null;

		return objExpr;
	},

	parseFunc: function(parentList)
	{
		this.nextToken();

		var name = this.tmpName;
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

		var funcExpr = this.scope.vars[name];
		if(!funcExpr) {
			funcExpr = new AST.Function(name, null, null, parentList);
			funcExpr.rootName = rootName;
			funcExpr.scope = new dopple.Scope(this.scope);
			this.scope.vars[name] = funcExpr;	
			this.funcs.push(funcExpr);			
		}
		else if(funcExpr.exprType !== this.exprEnum.FUNCTION) {
			dopple.error(funcExpr.line, dopple.Error.EXPECTED_FUNCTION, dopple.makeFuncName(funcExpr));
			return null;
		}

		this.scope = funcExpr.scope;
		
		var vars = this.parseFuncParams();
		if(!vars) { return null; }
		funcExpr.params = vars;		

		// Parse pre-inner body:
		this.nextToken();
		if(!this.parseFuncPost(funcExpr)) {
			return null;
		}	

		// Parse inner body:
		if(this.token.str !== "{") {
			this.tokenSymbolError();
			return null;
		}		

		this.nextToken();
		if(!this.parseBody(false)) {
			return null;
		}
		
		this.scope = this.scope.parent;
		return funcExpr;
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

		// Init Expression:
		this.nextToken();
		if(this.token.str !== ";")
		{
			expr = this.parseVar(false);
			if(!expr) { return null; }

			forExpr.initExpr = expr;
				
			if(this.token.str !== ";") {
				this.tokenSymbolError();
				return null;				
			}
		}
		
		// Compare Expression:
		this.nextToken();
		if(this.token.str !== ";")
		{
			expr = this.parseExpr(null);
			if(!expr) { return null; }

			forExpr.cmpExpr = expr;
				
			if(this.token.str !== ";") {
				this.tokenSymbolError();
				return null;				
			}
		}

		// Iter Expression:
		this.nextToken();
		if(this.token.str !== ")")
		{
			expr = this.parseExpr(null);
			if(!expr) { return null; }

			forExpr.iterExpr = expr;
				
			if(this.token.str !== ")") {
				this.tokenSymbolError();
				return null;				
			}
		}

		this.nextToken();
		if(this.token.str !== "{") {
			this.tokenSymbolError();
			return null;				
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

		forExpr.scope = virtualScope;
		this.scope.exprs.push(forExpr);

		return forExpr;
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
			newVar.isArg = true;
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

	parseFuncCall: function(parentList)
	{
		var funcExpr = this.getVar(this.currName, parentList);
		if(!funcExpr) { return null; }

		if(funcExpr.exprType !== this.exprEnum.FUNCTION) {
			dopple.error(funcExpr.line, dopple.Error.EXPECTED_FUNCTION, dopple.makeFuncName(funcExpr));
			return null;
		}

		var i = 0;
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
				expr = this.parseExpr(null);
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
		if(this.scope !== funcExpr.scope) {
			funcExpr.numUses++;
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
			varExpr.expr = this.parseExpr();
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

	parseParentList: function()
	{
		var parentList = [];

		do
		{
			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
			}

			var objExpr = this.getVar(this.currName);
			if(!objExpr) { return null; }

			parentList.push(objExpr);
			this.currName = this.token.str;

			this.nextToken();
		}
		while(this.token.str === ".");	

		return parentList;	
	},

	parseUntilExprEnd: function()
	{
		for(;;) 
		{
			this.nextToken();
			if(this.token.str === ";" || 
			   this.token.type === this.tokenEnum.KEYWORD || 
			   this.token.type === this.tokenEnum.EOF) 
			{
				break;
			}
		}
	},

	getVar: function(name, parentList) 
	{
		var expr = null;

		if(parentList)
		{
			var parentScope = parentList[parentList.length - 1].scope;
			expr = parentScope.vars[this.currName];
			if(!expr) {
				this.refError(dopple.makeName(this.currName, parentList));
				return null;
			}
		}
		else
		{
			var scope = this.scope;
			for(;;)
			{
				expr = scope.vars[name];

				// Success
				if(expr) { 
					expr.numUses++;
					break; 
				}

				if(!expr) 
				{
					if(scope === this.global) {
						this.refError(name);
						return null;					
					}

					scope = scope.parent;
				}
			}
		}

		return expr;
	},

	getFunc: function(name, parentList) 
	{
		var funcExpr = null;

		if(!parentList) {
			funcExpr = this.global.vars[name];
		}
		else
		{
			var numItems = parentList.length;
			if(numItems <= 0) {
				funcExpr = this.global.vars[name];
			}
			else
			{
				var fullName = "";
				for(var i = 0; i < numItems; i++) {
					fullName += parentList[i].name + "$";
				}
				fullName += name;

				var parentExpr = parentList[numItems - 1];
				funcExpr = parentExpr.scope.vars[fullName];				
			}
		}

		if(!funcExpr) 
		{
			funcExpr = new AST.Function(name, null, null, parentList);
			funcExpr.empty = true;
			funcExpr.rootName = name;

			this.scope.vars[name] = funcExpr;		
		}		

		return funcExpr;
	},

	makeFuncName: function(name, parentList)
	{
		if(!parentList) {
			return name;
		}

		var numItems = parentList.length;
		if(numItems <= 0) {
			return name;
		}
		
		var parentName = "";
		for(var i = 0; i < numItems; i++) {
			parentName += parentList[i].name + "$";
		}
		parentName += name;

		return parentName;		
	},

	tokenSymbolError: function()
	{
		this.isError = true;

		if(this.token.type === this.tokenEnum.EOF) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_EOI);
			return true;
		}
		else if(this.token.type === this.tokenEnum.KEYWORD) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_TOKEN, this.token.str);	
			return true;
		}
		else if(this.token.type === this.tokenEnum.NUMBER) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_NUMBER);
			return true;
		}
		else if(this.isTokenIllegal()) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
			return true;
		}
		else if(this.token.type !== this.tokenEnum.SYMBOL) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_ID);
			return true;
		}	

		return false;
	},

	tokenError: function() 
	{
		for(;;)
		{
			if(this.token.type !== this.tokenEnum.COMMENT) { break; }
			this.nextToken();
		}

		if(!this.tokenSymbolError()) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_TOKEN, this.token.str);	
		}	
	},

	refError: function(name) 
	{
		this.isError = true;
		dopple.error(this.line, dopple.Error.REFERENCE_ERROR, name);
	},

	handleUnexpectedToken: function() 
	{
		this.isError = true;

		if(isIllegal(this.token.str)) {
			dopple.error(this.line, dopple.Error.UNEXPECTED_TOKEN_ILLEGAL);
		}
		else {
			dopple.error(this.line, dopple.Error.UNEXPECTED_TOKEN, this.token.str);
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

	extern: null,

	error: null,

	global: null, 
	scope: null,
	funcs: null,

	varTypes: {},
	defTypes: {},
	process: {},
	numVarTypes: 0,	

	fileName: "source.js",
	line: 1,

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
		"/": 4000,
		"%": 4000
	},

	genID: 0,
	currName: "",
	tmpName: "",
	currVar: null,
	currExpr: false,
	parentList: null,
	
	isError: false,

	tokenEnum: dopple.TokenEnum,
	varEnum: dopple.VarEnum,
	exprEnum: dopple.ExprEnum
});

