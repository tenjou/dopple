"use strict";

function Tokenizer()
{
	this.buffer = "";
	this.bufferLength = 0;
	this.cursor = 0;
	this.currChar = "";
};

Tokenizer.prototype = 
{
	setBuffer: function(buffer) 
	{
		this.buffer = buffer;
		this.bufferLength = buffer.length;
		this.cursor = 0;
		this.currChar = "";
	},

	token: function()
	{
		var token = new Token();

		this.nextChar();

		// Skip spaces
		while(isSpace(this.currChar)) {
			this.nextChar();
		}		

		// String
		if(isAlpha(this.currChar)) 
		{
			token.str += this.currChar;
			this.nextChar();
			while(isAlphaNum(this.currChar)) {
				token.str += this.currChar;
				this.nextChar();
			}
			this.cursor--;

			if(token.str === "var") {
				token.type = Token.Type.VAR;
			}
			else if(token.str === "return") {
				token.type = Token.Type.RETURN;
			}
			else if(token.str === "function") {
				token.type = Token.Type.FUNCTION;
			}
			else if(token.str === "true") {
				token.type = Token.Type.BOOL;
				token.value = 1;
			}
			else if(token.str === "false") {
				token.type = Token.Type.BOOL;			
			}
			else {
				token.type = Token.Type.NAME;
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

			token.type = Token.Type.NUMBER;
			token.value = parseFloat(token.str);
			return token;
		}

		// BinOp
		if(isBinOp(this.currChar)) 
		{
			token.str = this.currChar;
			if(this.currChar === "-") 
			{
				this.nextChar();
				if(isDigit(this.currChar))
				{
					while(isDigit(this.currChar)) {
						token.str += this.currChar;
						this.nextChar();
					}					
					token.value = parseFloat(token.str);
					token.type = Token.Type.NUMBER;
					this.cursor--;
					return token;
				}

				this.cursor--;
			}	
			else if(this.currChar === "/") 
			{
				this.nextChar();
				if(this.currChar === "/") {
					this.skipUntilNewline();
					token.type = Token.Type.COMMENT;
					return token;
				}	
				else if(this.currChar === "*") {
					this.skipUntil("/");
					token.type = Token.Type.COMMENT;
					return token;
				}
				
				this.cursor--;
			}					

			token.type = Token.Type.BINOP;
			return token;
		}		

		// String
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

			token.type = Token.Type.STRING;
			return token;
		}

		// EOF
		if(this.currChar === "\0") {
			token.type = Token.Type.EOF;
			return token;
		}

		token.type = Token.Type.SYMBOL;
		token.str = this.currChar;
		return token;
	},

	nextChar: function(inc) 
	{
		if(this.cursor >= this.bufferLength) {
			this.currChar = "\0";
			return;
		}

		this.currChar = this.buffer.charAt(this.cursor);
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
	}	
};