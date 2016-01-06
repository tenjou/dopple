"use strict";

var dopple = 
{
	setup: function() 
	{
		
	},

	version: "0.0.1",

	compiler: {},

	types: [],
	typesMap: {}
};

dopple.mergeName = function(expr)
{
	var name = "";

	if(expr.exprType === dopple.ExprType.MEMBER) {
		name = dopple.mergeNameFromMember(expr);
	}
	else {
		name = expr.name;
	}

	return name;
};

dopple.mergeNameFromMember = function(memberExpr) 
{
	return memberExpr.left.name + "." + memberExpr.right.name;
};
