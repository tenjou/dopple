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
		
		this.tokenizer = new dopple.Tokenizer();
		this.extern = new dopple.Extern(this);
		
		this.process.varType = 0;
	},

	prepare: function() {
		this.loadVarEnum();
		this.loadExterns();
	},

	loadVarEnum: function() 
	{
		this.varEnum = {};
		for(var key in dopple._VarEnum) {
			this.varEnum[key] = dopple._VarEnum[key];
		}
		dopple.VarEnum = this.varEnum;

		this.varMap = {};
		dopple.VarMap = this.varMap;
	},

	loadExterns: function()
	{
		var string = this.extern.obj("String");
		string.mutator("length", this.varEnum.NUMBER, this.varEnum.NUMBER);
	},

	read: function(buffer) 
	{	
		this.tokenizer.setBuffer(buffer);
		this.nextToken();
		if(!this.parseBody(true)) {
			return false;
		}

		dopple.resolver.handle(this.global);
		return !dopple.isError;
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

					this.scope.exprs.push(expr);

					if(this.token.str !== ",") { break; }

					forceInitial = true;
					this.nextToken();
				}
			}
			else if(str === "this") {
				this.parseThis();
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
			else if(str === "function") {
				this.parseFunc();
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

			if(this.isError) { return false; }
			
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
		else if(str === "this") {
			expr = this.parseThis();
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

		if(this.isError) {
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
		var parentList = null;
		var line = this.token.line;

		this.currName = this.token.str;
		this.nextToken();

		if(this.token.str === ".") 
		{
			// Invalid if initialized with keyword:
			if(initial) {
				this.tokenError();
				return null;
			}

			parentList = this.parseParentList();
			if(!parentList) { return null; }

			if(this.token.str === "(") {
				return this.parseFuncCall(parentList);
			}
		}

		if(this.token.str === "(") {
			return this.parseFuncCall(parentList);
		}		

		var varExpr = new AST.Var(this.currName, parentList, this.process.varType);
		varExpr.line = line;
		return varExpr;
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

		var clsExpr = this.getVar(this.token.str);
		if(!clsExpr) { return null; }

		if(clsExpr.exprType !== this.exprEnum.CLASS) 
		{
			// If it's a function convert to a class:
			if(clsExpr.exprType === this.exprEnum.FUNCTION) {
				clsExpr = this.convertFuncToCls(clsExpr);
			}
			else {
				dopple.error(clsExpr.line, dopple.Error.EXPECTED_FUNC, dopple.makeFuncName(clsExpr));
				return null;				
			}
		}

		this.nextToken();

		if(this.token.str === "(") 
		{
			this.nextToken();

			if(this.token.str !== ")") {
				this.tokenSymbolError();
				return null;
			}

			this.nextToken();
		}

		var allocExpr = new AST.Alloc(clsExpr);
		allocExpr.type = allocExpr.cls.type;
		allocExpr.constrCall = new AST.FunctionCall(clsExpr.constrFunc);
		return allocExpr;
	},

	convertFuncToCls: function(funcExpr)
	{
		var parentScope = this.global;

		if(funcExpr.parentList) {
			parentScope = funcExpr.parentList[funcExpr.parentList - 1].scope;
		}

		// Class:
		var clsExpr = new AST.Class(funcExpr.name);
		clsExpr.scope = new dopple.Scope(parentScope, clsExpr);
		clsExpr.type = this.registerType(funcExpr.name);
		clsExpr.constrFunc = funcExpr;
		clsExpr.isStatic = false;
		clsExpr.childParentList = [ clsExpr ];
		clsExpr.scope.funcs.push(funcExpr);
		parentScope.vars[funcExpr.name] = clsExpr;	
		parentScope.objs.push(clsExpr);

		// Constructor:
		funcExpr.name = "constructor";
		funcExpr.parentList = [ clsExpr ];
		funcExpr.obj = clsExpr;
		funcExpr.scope.parent = clsExpr.scope;

		if(funcExpr.scope.staticVars) {
			clsExpr.scope.vars = funcExpr.scope.staticVars;
			funcExpr.scope.staticVars = null;
			funcExpr.scope.staticVarGroup = null;
		}				

		var funcs = parentScope.funcs;
		var numFuncs = funcs.length;
		for(var i = 0; i < numFuncs; i++) {
			if(funcs[i] === funcExpr) {
				funcs[i] = funcs[numFuncs - 1];
				funcs.pop();
				break;
			}
		}

		return clsExpr;	
	},

	parseVar: function(forceInitial, parseName)
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

		var varExpr = this.parseName();

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
			op = this.token.str;
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

		varExpr.expr = expr;
		varExpr.op = op;
		varExpr.isDef = initial;

		this.currName = "";
		this.tmpName = "";

		return varExpr;
	},	

	parseVarPost: function() {},

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

	parseThis: function()
	{
		var varExpr = null;
		var varName = "";
		var scope = this.scope;
		var parentList = [ new AST.This(scope.owner) ];

		this.nextToken();
		while(this.token.str === ".")
		{
			if(varExpr) 
			{
				if(varExpr.exprType !== this.tokenEnum.CLASS ||
				   varExpr.exprType !== this.tokenEnum.FUNCTION)
				{
					dopple.error(varExpr.line, dopple.Error.EXPECTED_CLS_OR_FUNC, dopple.makeFuncName(varExpr));
					return null;
				}

				parentList.push(varExpr);
			}
			else if(parentList.length > 1) {
				this.refError(this.token.str); 
				return null; 
			}

			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
				return null;
			}

			if(!scope.staticVars) {
				scope.staticVars = {};
				scope.staticVarGroup = [];
			}

			varName = this.token.str;
			varExpr = scope.staticVars[varName];
			
			this.nextToken();
		}

		if(parentList.length < 1) {
			this.tokenSymbolError();
			return null;
		}

		var op = this.token.str;

		this.nextToken();
		var expr = this.parseExpr();
		if(!expr) { return null; }

		varExpr = new AST.Var(varName, parentList);
		varExpr.expr = expr;
		varExpr.op = op;
		varExpr.isDef = true;
		varExpr.var = varExpr;
		scope.staticVars[varName] = varExpr;
		scope.exprs.push(varExpr);

		return null;
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

		var objExpr = new AST.Class(name);
		objExpr.scope = new dopple.Scope(this.global, objExpr);
		this.global.vars[name] = objExpr;
		if(!this.global.objs) {
			this.global.objs = [];
		}
		this.global.objs.push(objExpr);
		this.scope = objExpr.scope;

		var parentList = [ objExpr ];

		// Constructor:
		var constrFunc = new AST.Function("constructor", this.scope, null, parentList);
		constrFunc.obj = objExpr;
		this.scope.vars["constructor"] = constrFunc;
		objExpr.constrFunc = constrFunc;
		objExpr.scope.funcs.push(constrFunc);

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
			funcExpr.scope = new dopple.Scope(this.scope, funcExpr);
			this.scope.vars[name] = funcExpr;	
			this.scope.funcs.push(funcExpr);			
		}
		else if(funcExpr.exprType !== this.exprEnum.FUNCTION) {
			dopple.error(funcExpr.line, dopple.Error.EXPECTED_FUNC, dopple.makeFuncName(funcExpr));
			return null;
		}

		this.scope = funcExpr.scope;
		
		var vars = this.parseFuncParams();
		if(this.isError) { return null; }

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
		if(this.token.str !== "}") 
		{
			this.parseBody(false);
			if(this.isErorr) { return null; }
		}
		else {
			this.nextToken();
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
		else {
			this.nextToken();
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

		if(params.length === 0) {
			return null;
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
			dopple.error(funcExpr.line, dopple.Error.EXPECTED_FUNC, dopple.makeFuncName(funcExpr));
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
		var scope;
		var parentList = [];

		do
		{
			parentList.push(this.currName)

			this.nextToken();
			if(this.token.type !== this.tokenEnum.NAME) {
				this.tokenError();
				return null;
			}

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
		var expr = this.scope.vars[name];
		if(!expr) 
		{
			expr = this.global.vars[name];
			if(!expr) {
				return null;
			}
		}

		return expr;
	},

	getParentVar: function(name, list) 
	{
		var expr = this.scope.vars[name];
		if(!expr) 
		{
			expr = this.global.vars[name];
			if(!expr) {
				this.refError(name);
				return null;
			}
		}

		list.push(expr);
		return expr;
	},

	getFuncVar: function(name) 
	{
		var funcExpr = this.getVar(name);
		if(!funcExpr) { return null; }

		if(funcExpr.exprType !== this.exprEnum.FUNCTION) {
			dopple.error(funcExpr.line, dopple.Error.EXPECTED_FUNC, dopple.makeFuncName(funcExpr));
			return null;
		}	

		return funcExpr;	
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

	registerType: function(name) {
		var index = this.typeIndex++;
		this.varEnum[name] = index;
		this.varMap[index] = name;
		return index;
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

	typeIndex: 100,

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
	exprEnum: dopple.ExprEnum,
	varEnum: null,
	varMap: null
});

