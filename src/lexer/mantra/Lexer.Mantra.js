"use strict";

Lexer.Mantra = Lexer.Basic.extend
({
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
			// Check if variable has a defined type:
			if(this.token.str === ":") 
			{
				if(!this.readType()) { 
					return false; 
				}
			}
			else {
				this.process.varType = this.varTypes.VOID;
			}

			if(this.token.str === "=")
			{
				this.nextToken();

				var expr = this.parseExpression();
				if(!expr) { return false; }

				if(expr.exprType !== this.exprEnum.OBJECT &&
				   expr.exprType !== this.exprEnum.FUNCTION) 
				{
					if(!this._defineVar(expr, initial)) {
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

				if(!this._defineVar(null, initial)) {
					return false;
				}
			}
		}

		this.currName = "";

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