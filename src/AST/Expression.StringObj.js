"use strict";

Expression.StringObj = function(str) {
	this.value = str || "";
	this.type = Variable.Type.STRING_OBJ;
	this.length = this.hexLength(str.length);
};

Expression.StringObj.prototype = new Expression.Base(Expression.Type.STRING_OBJ);

Expression.StringObj.prototype.castTo = function(param)
{
	if(this.type === param.type) {
		return "\"" + this.length + "\"\"" + this.value + "\"";
	}
	else 
	{
		var varEnum = Variable.Type;
		if(param.type === varEnum.NUMBER) {
			var num = Number(this.value) || -1;
			return num;
		}		
		if(param.type === varEnum.STRING) {
			return "\"" + this.value + "\"";
		}
		else 
		{
			dopple.throw(dopple.Error.INVALID_TYPE_CONVERSION, 
				"\"" + param.name + "\" from " + this.strType() + " to " + param.strType());
		}		
	}
};

Expression.StringObj.prototype.defaultValue = function() {
	return "\"\\x0\\x0\\x0\\x0\"\"\"";
};

Expression.StringObj.prototype.hexLength = function(length) {
	return ToHex(length) + "\\x0\\x0\\x0";
};