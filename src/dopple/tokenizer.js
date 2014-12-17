"use strict";

dopple.Token = dopple.Class.extend
({
	print: function()
	{
		var tokenEnum = dopple.TokenEnum;
		switch(this.type)
		{
			case tokenEnum.EOF: return "(EOF)";
			case tokenEnum.SYMBOL: return "(SYMBOL " + this.str + ")";
			case tokenEnum.BINOP: return "(BINOP \"" + this.str + "\")";
			case tokenEnum.NUMBER: return "(NUMBER " + this.value + ")";
			case tokenEnum.BOOL: return "(BOOL " + this.value + ")";
			case tokenEnum.NAME: return "(NAME " + this.str + ")";
			case tokenEnum.STRING: return "(STRING \"" + this.str + "\")";
			case tokenEnum.VAR: return "(VAR)";
			case tokenEnum.RETURN: return "(RETURN)";
			case tokenEnum.FUNCTION: return "(FUNCTION)";
			case tokenEnum.COMMENT: return "(COMMENT)";
		}

		return "(Unknown)";
	},

	//
	type: 0,
	str: "",
	value: 0
});

dopple.Tokenizer = dopple.Class.extend
({
	init: function(buffer)  {
		this.customKeyword = {};
	},

	setBuffer: function(buffer) 
	{
		this.buffer = buffer;
		this.bufferLength = buffer.length;
		this.cursor = 0;
		this.currChar = "";
	},

	nextToken: function()
	{
		this.token.type = 0;
		this.token.str = "";
		this.token.value = 0;

		this.nextChar();

		// Skip spaces
		while(isSpace(this.currChar)) {
			this.nextChar();
		}		

		// NAME
		if(isAlpha(this.currChar)) 
		{
			this.token.str += this.currChar;
			this.nextChar();
			while(isAlphaNum(this.currChar)) {
				this.token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			if(this.token.str === "var") {
				this.token.type = this.tokenEnum.VAR;
			}
			else if(this.token.str === "if") {
				this.token.type = this.tokenEnum.IF;
			}
			else if(this.token.str === "return") {
				this.token.type = this.tokenEnum.RETURN;
			}
			else if(this.token.str === "function") {
				this.token.type = this.tokenEnum.FUNCTION;
			}
			else if(this.token.str === "true") {
				this.token.type = this.tokenEnum.BOOL;
				this.token.value = 1;
			}
			else if(this.token.str === "false") {
				this.token.type = this.tokenEnum.BOOL;			
			}
			else if(this.token.str === "NaN") {
				this.token.type = this.tokenEnum.NUMBER;
				this.token.value = NaN;
			}
			else if(this.customKeyword[this.token.str]) {
				this.token.type = this.customKeyword[this.token.str];
			}
			else {
				this.token.type = this.tokenEnum.NAME;
			}

			return this.token;
		}

		// Number
		if(isDigit(this.currChar)) 
		{
			this.token.str += this.currChar;

			this.nextChar();
			while(isDigit(this.currChar)) {
				this.token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			// Only a symbol:
			if(this.token.str === ".") {
				this.token.type = this.tokenEnum.SYMBOL;
				this.token.value = this.token.str;
				return this.token;
			}

			this.token.type = this.tokenEnum.NUMBER;
			this.token.value = parseFloat(this.token.str);
			return this.token;
		}

		// BinOp
		if(isBinOp(this.currChar)) 
		{
			this.token.str = this.currChar;

			if(this.currChar !== "=") 
			{
				this.nextChar();
				if(this.currChar === "=") {
					this.token.str += "=";
					this.token.type = this.tokenEnum.BINOP_ASSIGN;
					return this.token;					
				}
				else {
					this.cursor--;
				}
			}

			if(this.currChar === "=")
			{
				this.nextChar();			
				while(isBinOp(this.currChar)) {
					this.token.str += this.currChar;
					this.nextChar();
				}	

				this.cursor--;
				this.token.type = this.tokenEnum.ASSIGN;
			}
			else if(this.currChar === "-") 
			{
				this.nextChar();
				if(isDigit(this.currChar))
				{
					while(isDigit(this.currChar)) {
						this.token.str += this.currChar;
						this.nextChar();
					}					
					this.token.value = parseFloat(this.token.str);
					this.token.type = this.tokenEnum.NUMBER;
					this.cursor--;
					return this.token;
				}
				else if(this.currChar === "-") {
					this.token.str += "-";	
					this.token.type = this.tokenEnum.UNARY;			
				}
				else {
					this.cursor--;
					this.token.type = this.tokenEnum.BINOP;
				}
			}	
			else if(this.currChar === "+") 
			{
				this.nextChar();
				if(this.currChar === "+") {
					this.token.str += "+";
					this.token.type = this.tokenEnum.UNARY;
				}
				else {
					this.cursor--;
					this.token.type = this.tokenEnum.BINOP;
				}
			}
			else if(this.currChar === "/") 
			{
				this.nextChar();
				if(this.currChar === "/") {
					this.skipUntilNewline();
					this.token.type = this.tokenEnum.COMMENT;
					return this.token;
				}	
				else if(this.currChar === "*") {
					this.skipUntil("/");
					this.token.type = this.tokenEnum.COMMENT;
					return this.token;
				}
				
				this.cursor--;
				this.token.type = this.tokenEnum.BINOP;
			}					

			return this.token;
		}		

		// NAME
		if(this.currChar === "\"" || this.currChar === "'") 
		{
			var endChar = this.currChar;

			this.nextChar();
			while(this.currChar !== endChar)
			{
				if(this.currChar === "\0") {
					throw dopple.throw(dopple.Error.UNEXPECTED_EOI);
				}

				this.token.str += this.currChar;
				this.nextChar();
			}

			this.token.type = this.tokenEnum.STRING;
			return this.token;
		}

		// EOF
		if(this.currChar === "\0") {
			this.token.type = this.tokenEnum.EOF;
			return this.token;
		}

		this.token.type = this.tokenEnum.SYMBOL;
		this.token.str = this.currChar;
		return this.token;
	},

	peek: function() 
	{
		var tmpCursor = this.cursor;
		var token = this.nextToken();
		this.peekCursor = this.cursor;
		this.cursor = tmpCursor;
		return token;
	},

	eat: function() {
		this.cursor = this.peekCursor;
	},

	nextChar: function(inc) 
	{
		if(this.cursor >= this.bufferLength) {
			this.currChar = "\0";
		}
		else {
			this.currChar = this.buffer.charAt(this.cursor);
		}

		this.cursor++;
	},

	readUntil: function(symbol)
	{
		var output = "";

		this.nextChar();
		while(this.currChar !== symbol && this.currChar !== "\0") 
		{
			if(this.currChar === "\\") {
				output += "\\";
				this.nextChar();
			}

			output += this.currChar;
			this.nextChar();
		}

		return output;
	},

	skipUntil: function(symbol)
	{
		this.nextChar();
		while(this.currChar !== symbol && this.currChar !== "\0") {
			this.nextChar();
		}
	},	

	skipUntilNewline: function()
	{
		this.nextChar();
		while(this.currChar !== "\r" && this.currChar !== "\n" && this.currChar !== "\0") {
			this.nextChar();
		}
	},


	//
	buffer: "",
	bufferLength: 0,
	cursor: 0, peekCursor: 0,
	currChar: "",

	customKeyword: null,

	token: new dopple.Token(),
	tokenEnum: dopple.TokenEnum
});