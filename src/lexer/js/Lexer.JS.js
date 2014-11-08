"use strict";

Lexer.JS = Lexer.Basic.extend
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
				throw "Lexer.parseVar: Unhandled case!";
			}

			this.parentList = null;
		}
		else
		{	
			if(this.token.str === "=")
			{
				this.nextToken();

				var expr = this.parseExpression();
				if(!expr) { return false; }
				
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

		return true;
	}	
});