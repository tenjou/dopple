"use strict";

Expression.Number = function(value) {
	this.value = value;
	this.type = Variable.Type.NUMBER;
};

Expression.Number.prototype = new Expression.Base(Expression.Type.NUMBER);

Expression.Number.prototype.castTo = function(param)
{
	if(this.type === param.type) {
		return this.value;
	}
	else 
	{
		var varEnum = Variable.Type;
		if(param.type === varEnum.STRING) {
			return "\"" + this.value + "\"";
		}
		else if(param.type === varEnum.STRING_OBJ) {
			return "\"" + param.var.hexLength(this.value) + "\"\"" + this.value + "\"";
		}
		else {
			dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, this);
		}		
	}
};

Expression.Number.prototype.defaultValue = function() {
	return "0";
};