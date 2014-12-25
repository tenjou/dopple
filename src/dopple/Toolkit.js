"use strict";

dopple.makeVarName = function(varExpr)
{
	var parentList = varExpr.parentList;
	if(!parentList) {
		return varExpr.value;
	}

	var numItems = parentList.length;
	if(numItems <= 0) {
		return varExpr.value;
	}
	
	var name = "";
	for(var i = 0; i < numItems; i++) {
		name += parentList[i].value + ".";
	}
	name += varExpr.value;

	return name;
};

dopple.makeFuncName = function(funcExpr)
{
	var parentList = funcExpr.parentList;
	if(!parentList) {
		return funcExpr.name;
	}

	var numItems = parentList.length;
	if(numItems <= 0) {
		return funcExpr.name;
	}
	
	var name = "";
	for(var i = 0; i < numItems; i++) {
		name += parentList[i].name + "$";
	}
	name += funcExpr.name;

	return name;		
};
