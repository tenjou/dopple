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
		name += parentList[i].name + ".";
	}
	name += varExpr.value;

	return name;
};

dopple.makeName = function(name, parentList)
{
	if(!parentList) {
		return name;
	}

	var numItems = parentList.length;
	if(numItems <= 0) {
		return name;
	}
	
	var newName = "";
	for(var i = 0; i < numItems; i++) {
		newName += parentList[i].name + ".";
	}
	newName += name;

	return newName;
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

dopple.createVarFromType = function(type)
{
	var expr;
	var varEnum = dopple.VarEnum;
	if(type === varEnum.NUMBER) {
		expr = new AST.Number(0);
	}
	else if(type === varEnum.NAME) {
		expr = new AST.Name("");
	}
	else if(type === varEnum.STRING) {
		expr = new AST.String("");
	}
	else if(type === varEnum.FORMAT) {
		expr = new AST.Format();
	}

	var varExpr = new AST.Var();
	varExpr.type = type;
	varExpr.var = expr;	
	
	return varExpr;	
};

