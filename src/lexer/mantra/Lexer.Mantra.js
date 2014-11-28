"use strict";

Lexer.Mantra = Lexer.Basic.extend
({
	init: function() {
		this.tokenizer.customKeyword["func"] = this.tokenEnum.FUNCTION;
	},

	parseVarPost: function()
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
			this.scope.vars[newVar.value] = newVar;
			
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