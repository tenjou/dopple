"use strict";

dopple.Scope = function(parent)
{
	this.parent = parent || null;
	this.vars = {};
	this.varGroup = {};
	this.exprs = [];
	this.returns = [];
	this.tmps = {
		id: 0
	}
};

dopple.Scope.prototype = 
{
	createVirtual: function() {
		var scope = new dopple.Scope();
		scope.parent = this;
		scope.vars = this.vars;
		scope.returns = this.returns;
		scope.temps = this.tmps;
		scope.isVirtual = true;
		return scope;
	},

	addTmp: function(type)
	{
		var name = "__temp" + this.tmps.id++;
		var varExpr = new AST.Var(name, null, type);
		varExpr.var = varExpr;

		var group = this.varGroup[type];
		if(!group) {
			group = [];
			this.varGroup[type] = group;
		}
		group.push(varExpr);

		return varExpr;
	},

	addTmpI32: function() {
		return this.addTmp(dopple.VarEnum.I32);
	},

	addTmpDouble: function() {
		return this.addTmp(dopple.VarEnum.NUMBER);
	},	

	addTmpString: function() {
		return this.addTmp(dopple.VarEnum.STRING);
	},		

	//
	defOutput: "",
	isVirtual: false
};
