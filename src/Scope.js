"use strict";

dopple.ScopeCache = function() {}
dopple.ScopeCache.prototype = {
	id: 0,
	decls: null,
	declGroups: null,
	declOutput: "",
	preOutput: "",
	freeGens: null
};

dopple.Scope = function(parent) {
	this.parent = parent || null;
	this.vars = {};
	this.body = [];
	this.cache = new dopple.ScopeCache();
};

dopple.Scope.prototype = 
{
	createVirtual: function() {
		var scope = new dopple.Scope(this.scope);
		scope.cache = this.cache;
		scope.virtual = true;
		return scope;
	},

	genVar: function(cls) 
	{
		var name = "__gen__" + (this.cache.id++) + "__";

		var varExpr = new dopple.AST.Var(name, null);
		varExpr.cls = cls;

		return name;
	},

	freeGenVar: function() {

	},

	genI32: function() {
		return this.genVar(dopple.nativeVars.I32);
	},

	genDouble: function() {
		return this.genVar(dopple.scope.vars.Number);
	},

	genString: function() {
		return this.genVar(dopple.scope.vars.String);
	},

	//
	virtual: false,
	funcs: null,
	returns: null,
	classes: []
};
