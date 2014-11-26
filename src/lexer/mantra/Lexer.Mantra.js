"use strict";

Lexer.Mantra = Lexer.Basic.extend
({
	init: function() {
		this.tokenizer.customKeyword["func"] = this.tokenEnum.FUNCTION;
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
			// Check if variable has a defined type:
			if(this.token.str === ":") 
			{
				if(!this.readType()) { 
					return false; 
				}
			}
			else {
				this.process.varType = this.varEnum.VOID;
			}

			if(this.token.str === "=")
			{
				this.nextToken();

				var expr = this.parseExpression();
				if(!expr) { return false; }

				if(expr.exprType !== this.exprEnum.CLASS &&
				   expr.exprType !== this.exprEnum.FUNCTION) 
				{
					if(!this._defineVar(varName, expr, initial)) {
						return false;
					}	
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

				if(!this._defineVar(varName, null, initial)) {
					return false;
				}
			}
		}

		this.currName = "";

		return true;
	},

	parseFuncParams: function()
	{
		var newVar;
		var vars = [];
		this.nextToken();
		while(this.token.type === this.tokenEnum.NAME) 
		{
			newVar = new AST.Var(this.token.str);
			newVar.var = newVar;
			vars.push(newVar);
			this.scope.vars[newVar.name] = newVar;
			
			this.nextToken();

			// Check if variable has a defined type:
			if(this.token.str === ":") 
			{
				if(!this.readType()) { 
					return null; 
				}
				newVar.type = this.process.varType;
			}
			else {
				newVar.type = 0;
			}
			
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

		return vars;		
	},

	parseFuncPost: function(funcExpr) 
	{
		if(this.token.str === ":") 
		{
			if(!this.readType()) { 
				return false; 
			}
			funcExpr.type = this.process.varType;
		}
		else {
			funcExpr.type = 0;
		}

		return true;
	},

	readType: function()
	{
		this.nextToken();

		if(this.token.type !== this.tokenEnum.NAME) {
			console.error("PARSE_VAR: Expected type defintion of the variable, instead of: " + this.token.print());
			return false;
		}

		// Check if defined as primary variable type:
		var varType = this.varEnum[this.token.str.toUpperCase()];
		if(!varType) 
		{
			// Check if defined as user defined variable type:
			varType = this.defTypes[this.token.str];
			if(!varType) {
				console.error("PARSE_VAR: Undefined type definition: \"" + this.token.str + "\"");
				return false;				
			}
		}

		this.process.varType = varType;
		this.nextToken();

		return true;
	}		
});