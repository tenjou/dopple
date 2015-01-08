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
	value: 0,
	line: 0
});

dopple.Tokenizer = dopple.Class.extend
({
	init: function()  {
		this.customKeyword = {};
	},

	setBuffer: function(buffer) 
	{
		this.buffer = buffer;
		this.bufferLength = buffer.length;
		this.cursor = 0;
		this.currChar = "";
	},

	nextToken: function(token)
	{
		if(!token) {
			token = this.token;
		}
		
		token.type = 0;
		token.str = "";
		token.value = 0;

		this.nextChar();

		// Skip spaces
		while(isSpace(this.currChar)) {
			this.nextChar();
		}

		token.line = this.line;

		// NAME
		if(isAlpha(this.currChar)) 
		{
			token.str += this.currChar;
			this.nextChar();
			while(isAlphaNum(this.currChar)) {
				token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			var strToken = token.str;
			if(this.isKeyword(strToken)) 
			{
				token.type = this.tokenEnum.KEYWORD;

				if(strToken === "else") 
				{
					this.internalPeek();
					if(this.internalPeekToken.str === "if") {
						this.internalEat();
						token.str = "else if";
					}
				}				
			}
			else if(strToken === "true") {
				token.type = this.tokenEnum.BOOL;
				token.value = 1;
			}
			else if(strToken === "false") {
				token.type = this.tokenEnum.BOOL;			
			}
			else if(strToken === "NaN") {
				token.type = this.tokenEnum.NUMBER;
				token.value = NaN;
			}
			else if(this.customKeyword[strToken]) {
				token.type = this.customKeyword[strToken];
			}
			else {
				token.type = this.tokenEnum.NAME;
			}

			return token;
		}

		// Number
		if(isDigit(this.currChar)) 
		{
			token.str += this.currChar;

			this.nextChar();
			while(isDigit(this.currChar)) {
				token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			// Only a symbol:
			if(token.str === ".") {
				token.type = this.tokenEnum.SYMBOL;
				token.value = token.str;
				return token;
			}

			token.type = this.tokenEnum.NUMBER;
			token.value = parseFloat(token.str);
			return token;
		}

		// BinOp
		if(isBinOp(this.currChar)) 
		{
			token.str = this.currChar;

			if(this.currChar !== "=") 
			{
				this.nextChar();
				if(this.currChar === "=") {
					token.str += "=";
					token.type = this.tokenEnum.BINOP_ASSIGN;
					return token;					
				}
				else {
					this.prevChar();
				}
			}

			if(this.currChar === "=")
			{
				this.nextChar();			
				while(isBinOp(this.currChar)) {
					token.str += this.currChar;
					this.nextChar();
				}	

				this.cursor--;
				token.type = this.tokenEnum.ASSIGN;
			}
			else if(this.currChar === "-") 
			{
				this.nextChar();
				if(isDigit(this.currChar))
				{
					while(isDigit(this.currChar)) {
						token.str += this.currChar;
						this.nextChar();
					}					
					token.value = parseFloat(token.str);
					token.type = this.tokenEnum.NUMBER;
					this.cursor--;
					return token;
				}
				else if(this.currChar === "-") {
					token.str += "-";	
					token.type = this.tokenEnum.UNARY;			
				}
				else {
					this.cursor--;
					token.type = this.tokenEnum.BINOP;
				}
			}	
			else if(this.currChar === "+") 
			{
				this.nextChar();
				if(this.currChar === "+") {
					token.str += "+";
					token.type = this.tokenEnum.UNARY;
				}
				else {
					this.cursor--;
					token.type = this.tokenEnum.BINOP;
				}
			}
			else if(this.currChar === "/") 
			{
				this.nextChar();
				if(this.currChar === "/") {
					this.skipUntilNewline();
					token.type = this.tokenEnum.COMMENT;
					return token;
				}	
				else if(this.currChar === "*") {
					this.skipUntil("/");
					token.type = this.tokenEnum.COMMENT;
					return token;
				}
				
				this.cursor--;
				token.type = this.tokenEnum.BINOP;
			}	
			else {
				token.type = this.tokenEnum.BINOP;
			}				

			return token;
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

				token.str += this.currChar;
				this.nextChar();
			}

			token.type = this.tokenEnum.STRING;
			return token;
		}

		// EOF
		if(this.currChar === "\0") {
			token.type = this.tokenEnum.EOF;
			return token;
		}

		token.type = this.tokenEnum.SYMBOL;
		token.str = this.currChar;
		return token;
	},

	peek: function() 
	{
		var tmpCursor = this.cursor;

		this.nextToken(this.peekToken);

		this.peekCursor = this.cursor;
		this.cursor = tmpCursor;

		return this.peekToken;
	},

	eat: function() 
	{
		this.token.type = this.peekToken.type;
		this.token.str = this.peekToken.str;
		this.token.value = this.peekToken.value;
		this.cursor = this.peekCursor;
	},

	internalPeek: function() 
	{
		var tmpCursor = this.cursor;

		this.nextToken(this.internalPeekToken);

		this.internalPeekCursor = this.cursor;
		this.cursor = tmpCursor;

		return this.internalPeekToken;
	},

	internalEat: function() 
	{
		this.token.type = this.internalPeekToken.type;
		this.token.str = this.internalPeekToken.str;
		this.token.value = this.internalPeekToken.value;
		this.cursor = this.internalPeekCursor;
	},	

	nextChar: function() 
	{
		if(this.cursor >= this.bufferLength) {
			this.currChar = "\0";
		}
		else {
			this.currChar = this.buffer.charAt(this.cursor);
		}

		if(this.currChar === "\n") {
			this.line++;
		}

		this.cursor++;
	},

	prevChar: function() {
		this.cursor--;
		this.currChar = this.buffer.charAt(this.cursor - 1);
	},

	isKeyword: function(str)
	{
		if(str === "var" || str === "this" || str === "function" || str === "new" || str === "return" ||
		   str === "if" || str === "else" || str === "for" || str === "while" || str === "do" )
		{
			return true;
		}

		return false;
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
	cursor: 0, peekCursor: 0, internalPeekCursor: 0,
	currChar: "",
	line: 1,

	customKeyword: null,

	token: new dopple.Token(),
	peekToken: new dopple.Token(),
	internalPeekToken: new dopple.Token(),
	tokenEnum: dopple.TokenEnum
});