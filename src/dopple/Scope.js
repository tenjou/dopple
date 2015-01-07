"use strict";

dopple.Scope = function(parent)
{
	this.parent = parent || null;
	this.vars = {};
	this.varGroup = null;
	this.funcs = [];
	this.exprs = [];
	this.objs = [];
	this.returns = [];
	this.tmps = {
		id: 0,
		free: {},
		freeBlock: {}
	}
};

dopple.Scope.prototype = 
{
	createVirtual: function() {
		var scope = new dopple.Scope();
		scope.parent = this;
		scope.vars = this.vars;
		scope.funcs = this.funcs;
		scope.returns = this.returns;
		scope.temps = this.tmps;
		scope.isVirtual = true;
		return scope;
	},

	endTmpBlock: function()
	{
		var free, block, i, numItems;
		var freeBlock = this.tmps.freeBlock;
		for(var key in freeBlock)
		{
			free = this.tmps.free[key];
			block = freeBlock[key];
			numItems = block.length;
			if(numItems > free.length) {
				free.length = numItems;
			}

			for(i = 0; i < numItems; i++) {
				free[i] = block[i];
			}

			block.length = 0;
		}
	},

	addTmp: function(type, reuse)
	{
		var varExpr, name, group;

		if(reuse)
		{
			var block = this.tmps.free[type];
			if(!block) {
				block = [];
				this.tmps.free[type] = block;
				this.tmps.freeBlock[type] = [];
			}

			if(block.length === 0)
			{
				var name = "__temp" + this.tmps.id++;
				varExpr = new AST.Var(name, null, type);
				varExpr.var = varExpr;
				varExpr.type = type;

				var group = this.varGroup[type];
				if(!group) {
					group = [];
					this.varGroup[type] = group;
				}
				group.push(varExpr);
			}
			else {
				varExpr = block.pop();
			}

			this.tmps.freeBlock[type].push(varExpr);
		}
		else
		{
			var name = "__temp" + this.tmps.id++;
			varExpr = new AST.Var(name, null, type);
			varExpr.var = varExpr;

			var group = this.varGroup[type];
			if(!group) {
				group = [];
				this.varGroup[type] = group;
			}
			group.push(varExpr);			
		}

		return varExpr;
	},

	addTmpI32: function(reuse) {
		return this.addTmp(dopple.VarEnum.I32, reuse);
	},

	addTmpDouble: function(reuse) {
		return this.addTmp(dopple.VarEnum.NUMBER, reuse);
	},	

	addTmpString: function(reuse) {
		return this.addTmp(dopple.VarEnum.STRING, reuse);
	},		

	//
	defOutput: "",
	isVirtual: false
};
